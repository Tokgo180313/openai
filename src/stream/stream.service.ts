import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { ProviderService } from 'src/provider/provider.service';
import { StreamMessageDto } from './dto/stream.dto';
import {
  normalizeOpenAIBaseURL,
  OPENAI_DEFAULT_BASE_URL,
} from 'src/common/utils/openai-base-url.util';
import { inferUserContentInputType } from 'src/common/utils/user-input-type.util';
import { ChatService } from 'src/chat/chat.service';
import { ChatEntity } from 'src/chat/entity/Chat.entity';
import { ContentEntity } from 'src/chat/entity/ContentEntity';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Collection, GridFSBucket, ObjectId } from 'mongodb';
import { readFile } from 'node:fs/promises';

/** 流结束后由 streamGenerateContentByOpenAI 写入 OpenAI 返回的 usage（若网关支持） */
export type StreamCompletionUsageOut = {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type UploadSessionDoc = {
  userId: string;
  fileName?: string;
  mimeType?: string;
  gridFsFileId?: string;
  openaiFileId?: string;
  status?: 'uploading' | 'completed';
};

type InputFilePayload = {
  type: 'input_file';
  file_id: string;
};

type InputImagePayload = {
  type: 'input_url';
  image_base64: string;
  mimeType?: string;
};

type InputTextPayload = {
  type: 'input_text';
  text: string;
};

type UserInputPayload = InputFilePayload | InputImagePayload | InputTextPayload;

@Injectable()
export class StreamService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly abortControllers = new Map<string, AbortController>();
  private readonly stoppedKeys = new Set<string>();
  private bucket: GridFSBucket;
  private uploadSessionCollection: Collection<UploadSessionDoc>;
  private fileMappingCollection: Collection;
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private configService: ConfigService,
    private readonly providerService: ProviderService,
    private readonly encryptionService: EncryptionService,
    private readonly chatService: ChatService,
  ) {}
  onModuleInit() {
    const db = this.connection.db;
    if (!db) {
      throw new Error('mongodb connection is not initialized');
    }
    this.bucket = new GridFSBucket(db, {
      bucketName: 'uploaded_files',
    });
    this.uploadSessionCollection =
      db.collection<UploadSessionDoc>('upload_sessions');
    this.fileMappingCollection = db.collection('files');

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    // 仅在配置了 Gemini 时初始化；这样当只走 OpenAI 路由时不会因为缺少 Gemini key 直接启动失败
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }

  /**
   * 从 OpenAI Chat Completions 获取流式增量文本，并逐段 yield 给 controller。
   */
  public async *streamGenerateContentByOpenAI(
    dtoList: StreamMessageDto[],
    usageOut?: StreamCompletionUsageOut,
  ): AsyncGenerator<string> {
    if (!Array.isArray(dtoList) || dtoList.length === 0) {
      throw new BadRequestException('stream message list is required');
    }
    const dto = dtoList[dtoList.length - 1];
    const prompt = String(dto?.prompt ?? '').trim();
    if (!prompt) {
      throw new BadRequestException('prompt is required');
    }
    const documentId = String(dto?.documentId ?? '').trim();
    if (!documentId) {
      throw new BadRequestException('documentId is required');
    }
    const provider = String(dto?.provider ?? dto?.modelClassify ?? '').trim();
    if (!provider) {
      throw new BadRequestException('provider is required');
    }

    const keyDoc = await this.providerService.findByProvider(provider);
    if (!keyDoc?.apiKey) {
      throw new NotFoundException(
        `no api key configured for provider: ${provider}`,
      );
    }
    const rawBase = String(keyDoc.baseURL ?? '').trim();
    if (!rawBase) {
      throw new NotFoundException(
        `no baseURL configured for provider: ${provider}`,
      );
    }

    let apiKey: string;
    try {
      apiKey = this.encryptionService.decrypt(keyDoc.apiKey);
    } catch {
      throw new BadRequestException('failed to decrypt stored apiKey');
    }

    const baseURL = normalizeOpenAIBaseURL(rawBase) ?? OPENAI_DEFAULT_BASE_URL;

    const model = String(dto?.model ?? '').trim() || 'gpt-4o-mini';

    const openai = new OpenAI({ apiKey, baseURL });

    const normalizeRole = (
      role: string | undefined,
    ): 'system' | 'assistant' | 'user' => {
      const r = String(role ?? '')
        .trim()
        .toLowerCase();
      if (r === 'system') return 'system';
      if (r === 'assistant') return 'assistant';
      return 'user';
    };

    const streamKey = this.buildStreamKey(dto.userId, documentId);
    this.stoppedKeys.delete(streamKey);
    const abortController = new AbortController();
    this.abortControllers.set(streamKey, abortController);

    // 先落库本轮用户消息，再按 documentId 拉全量会话拼 messages
    await this.saveRequest(
      dtoList,
      model,
      dto.userId,
      dto.titleId,
      documentId,
      apiKey,
      baseURL,
    );

    const history = await this.chatService.chatList(documentId);
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    for (const item of history) {
      const role = normalizeRole(item.role);
      if (role === 'assistant' || role === 'system') {
        const contentText = String(item.content ?? '').trim();
        if (contentText) {
          messages.push({
            role,
            content: contentText,
          });
        }
        continue;
      }
      const content = await this.buildUserMessageContent(
        openai,
        dto.userId,
        documentId,
        item,
      );
      if (content.length > 0) {
        messages.push({
          role,
          content: content as any,
        });
      }
    }
    const mergedMessages = this.mergeMessagesByRole(messages);

    if (mergedMessages.length === 0) {
      throw new BadRequestException('messages is empty');
    }
    const openaiMessages = this.toOpenAIChatMessages(mergedMessages);
    try {
      const stream = await openai.chat.completions.create(
        {
          model,
          messages: openaiMessages,
          stream: true,
          stream_options: { include_usage: true },
        },
        { signal: abortController.signal } as any,
      );
      
      for await (const chunk of stream) {
        if (this.stoppedKeys.has(streamKey)) {
          break;
        }
        if (chunk.usage && usageOut) {
          usageOut.usage = {
            prompt_tokens: chunk.usage.prompt_tokens,
            completion_tokens: chunk.usage.completion_tokens,
            total_tokens: chunk.usage.total_tokens,
          };
        }
        const piece = chunk.choices[0]?.delta?.content;
        if (piece) {
          yield piece;
        }
      }
    } catch (error: any) {
      if (abortController.signal.aborted || this.stoppedKeys.has(streamKey)) {
        return;
      }
      throw error;
    } finally {
      this.abortControllers.delete(streamKey);
    }
  }

  public stopStream(userId: string, documentId: string): boolean {
    const streamKey = this.buildStreamKey(userId, documentId);
    this.stoppedKeys.add(streamKey);
    const controller = this.abortControllers.get(streamKey);
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  }

  public clearStopped(userId: string, documentId: string): void {
    const streamKey = this.buildStreamKey(userId, documentId);
    this.stoppedKeys.delete(streamKey);
  }

  public isStopped(userId: string, documentId: string): boolean {
    const streamKey = this.buildStreamKey(userId, documentId);
    return this.stoppedKeys.has(streamKey);
  }

  private buildStreamKey(userId: string, documentId: string): string {
    return `${userId}:${documentId}`;
  }

  public async saveRequest(
    dtoList: StreamMessageDto[],
    model: string,
    userId: string,
    titleId: string,
    documentId: string,
    apiKey: string,
    baseURL: string,
  ) {
    if (!Array.isArray(dtoList) || dtoList.length === 0) {
      throw new BadRequestException('stream message list is required');
    }
    const latest = dtoList[dtoList.length - 1];
    const prompt = String(latest?.prompt ?? '').trim();
    if (!prompt) {
      throw new BadRequestException('prompt is required');
    }

    if (!titleId) {
      let title = '';
      try {
        const openai = new OpenAI({ apiKey, baseURL });
        const titleResponse = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content:
                '你是一个标题生成助手。请根据用户输入生成一个简短标题，只返回标题文本本身，不要包含引号、序号、解释或换行。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: false,
        });
        title = String(
          titleResponse.choices?.[0]?.message?.content ?? '',
        ).trim();
      } catch {
        title = '';
      }
      if (!title) {
        title = prompt.slice(0, 30);
      }
      let chatEntity = new ChatEntity({
        userId: userId,
        documentId: documentId,
        title: title,
      });
      await this.chatService.addNewTitle(chatEntity);
    }
    for (const item of dtoList) {
      const message = String(item?.prompt ?? '').trim();
      const fileUrl = String(item?.fileUrl ?? '').trim();
      const inputUrlField = String(item?.input_url ?? '').trim();
      const imageB64Field = String(item?.image_base64 ?? '').trim();
      const hasImagePayload = !!inputUrlField || !!imageB64Field;
      const hasFilePayload =
        !!fileUrl ||
        !!String(item?.fileName ?? '').trim() ||
        hasImagePayload;
      if (!message && !hasFilePayload) {
        continue;
      }
      const normalizedType = inferUserContentInputType(
        item as unknown as Record<string, unknown>,
      );
      const content: ContentEntity = {
        role: 'user',
        content: message || '[file]',
        useModel: String(item?.model ?? '').trim() || model,
        documentId: String(item?.documentId ?? '').trim() || documentId,
        type: normalizedType,
        fileName: String(item?.fileName ?? '').trim() || undefined,
        mimeType: String(item?.mimeType ?? '').trim() || undefined,
        fileUrl: fileUrl || undefined,
        input_url: String(item?.input_url ?? '').trim() || undefined,
        image_base64: String(item?.image_base64 ?? '').trim() || undefined,
      };
      await this.chatService.addNewContent(content);
    }
  }
  public async saveResponse(
    response: string,
    model: string,
    documentId: string,
  ) {
    const content: ContentEntity = {
      role: 'assistant',
      content: response,
      useModel: model,
      documentId: documentId,
    };
    await this.chatService.addNewContent(content);
  }

  private async buildUserMessageContent(
    openai: OpenAI,
    userId: string,
    documentId: string,
    item: any,
  ): Promise<UserInputPayload[]> {
    const type = inferUserContentInputType(item as Record<string, unknown>);
    const text = String(item?.content ?? item?.text ?? '').trim();
    let fileId = String(item?.openaiFileId ?? item?.file_id ?? '').trim();

    if (type === 'input_file' && fileId) {
      const valid = await this.isFileValid(openai, fileId);
      if (!valid) {
        const latestFileId = await this.reuploadAndRefreshOpenaiFileId(
          openai,
          userId,
          documentId,
          fileId,
        );
        fileId = latestFileId;
      }
    }
    if (type === 'input_url') {
      const resolved = await this.resolveInputUrlImageBase64(item);
      if (resolved.base64) {
        return [
          {
            type: 'input_url',
            image_base64: resolved.base64,
            mimeType:
              String(item?.mimeType ?? '').trim() || resolved.mimeType,
          },
        ];
      }
      if (text) {
        return [{ type: 'input_text', text }];
      }
      throw new BadRequestException(
        'input_url requires image data (image_base64, input_url as URL/data URL, file hydration, or readable fileUrl)',
      );
    }

    if (type === 'input_file') {
      return [{ type: 'input_file', file_id: fileId }];
    }

    return [{ type: 'input_text', text }];
  }

  private normalizeImageBase64(imageBase64: string): string {
    const raw = String(imageBase64 ?? '').trim();
    if (!raw) {
      return '';
    }
    return raw.replace(/^data:[^;]+;base64,/i, '');
  }

  /**
   * Resolves raw base64 (no data: prefix) for OpenAI input_url from stored/API fields.
   * mimeType is set when inferable from a data URL.
   */
  private async resolveInputUrlImageBase64(
    item: Record<string, unknown>,
  ): Promise<{ base64: string; mimeType?: string }> {
    const empty = { base64: '' };

    const direct = String(item?.image_base64 ?? '').trim();
    if (direct) {
      return { base64: this.normalizeImageBase64(direct) };
    }

    const urlField = String(item?.input_url ?? '').trim();
    if (urlField) {
      if (/^data:/i.test(urlField)) {
        const mimeMatch = urlField.match(/^data:([^;]+);base64,/i);
        return {
          base64: this.normalizeImageBase64(urlField),
          mimeType: mimeMatch?.[1],
        };
      }
      if (/^https?:\/\//i.test(urlField)) {
        try {
          const res = await fetch(urlField);
          if (!res.ok) {
            return empty;
          }
          const mimeHeader = String(res.headers.get('content-type') ?? '')
            .split(';')[0]
            .trim();
          return {
            base64: Buffer.from(await res.arrayBuffer()).toString('base64'),
            mimeType:
              mimeHeader && mimeHeader !== 'application/octet-stream'
                ? mimeHeader
                : undefined,
          };
        } catch {
          return empty;
        }
      }
      return { base64: this.normalizeImageBase64(urlField) };
    }

    const fileData = String(item?.file ?? '').trim();
    if (fileData && /^data:/i.test(fileData)) {
      const mimeMatch = fileData.match(/^data:([^;]+);base64,/i);
      return {
        base64: this.normalizeImageBase64(fileData),
        mimeType: mimeMatch?.[1],
      };
    }

    const path = String(item?.fileUrl ?? item?.file_url ?? '').trim();
    if (path) {
      try {
        const buffer = await readFile(path);
        return { base64: buffer.toString('base64') };
      } catch {
        return empty;
      }
    }

    return empty;
  }

  private mergeMessagesByRole(
    messages: OpenAI.ChatCompletionMessageParam[],
  ): OpenAI.ChatCompletionMessageParam[] {
    console.dir(messages, { depth: null });
    const merged: OpenAI.ChatCompletionMessageParam[] = [];
    for (const message of messages) {
      const prev = merged[merged.length - 1];
      if (!prev || prev.role !== message.role) {
        merged.push(message);
        continue;
      }

      const prevContent = (prev as any).content;
      const currContent = (message as any).content;
      if (Array.isArray(prevContent) && Array.isArray(currContent)) {
        (prev as any).content = [...prevContent, ...currContent];
        continue;
      }
      if (typeof prevContent === 'string' && typeof currContent === 'string') {
        (prev as any).content = `${prevContent}\n${currContent}`.trim();
        continue;
      }
      if (Array.isArray(prevContent) && typeof currContent === 'string') {
        (prev as any).content = [
          ...prevContent,
          { type: 'input_text', text: currContent },
        ];
        continue;
      }
      if (typeof prevContent === 'string' && Array.isArray(currContent)) {
        (prev as any).content = [
          { type: 'input_text', text: prevContent },
          ...currContent,
        ];
      }
    }
    return merged;
  }

  private toOpenAIChatMessages(
    messages: OpenAI.ChatCompletionMessageParam[],
  ): OpenAI.ChatCompletionMessageParam[] {
    return messages
      .map((message) => {
        const role = (message.role ?? 'user') as 'system' | 'assistant' | 'user';
        const rawContent = (message as any).content;
        if (typeof rawContent === 'string') {
          return {
            role,
            content: rawContent,
          } as OpenAI.ChatCompletionMessageParam;
        }
        if (!Array.isArray(rawContent)) {
          return null;
        }
        const parts: OpenAI.ChatCompletionContentPart[] = [];
        for (const item of rawContent as UserInputPayload[]) {
          if (!item || typeof item !== 'object') {
            continue;
          }
          if (item.type === 'input_text') {
            const text = String((item as InputTextPayload).text ?? '').trim();
            if (text) {
              parts.push({ type: 'text', text });
            }
            continue;
          }
          if (item.type === 'input_url') {
            const img = item as InputImagePayload;
            const base64 = String(img.image_base64 ?? '').trim();
            if (base64) {
              const mime =
                String(img.mimeType ?? '').trim() || 'image/png';
              parts.push({
                type: 'image_url',
                image_url: { url: `data:${mime};base64,${base64}` },
              });
            }
            continue;
          }
          if (item.type === 'input_file') {
            const fileId = String((item as InputFilePayload).file_id ?? '').trim();
            if (fileId) {
              parts.push({ type: 'text', text: `file_id:${fileId}` });
            }
          }
        }
        if (parts.length === 0) {
          return null;
        }
        return {
          role,
          content: parts,
        } as OpenAI.ChatCompletionMessageParam;
      })
      .filter(Boolean) as OpenAI.ChatCompletionMessageParam[];
  }

  private async isFileValid(openai: OpenAI, fileId: string): Promise<boolean> {
    const targetFileId = String(fileId ?? '').trim();
    if (!targetFileId) {
      return false;
    }
    try {
      const res = await openai.files.retrieve(targetFileId);
      return String(res?.id ?? '').trim() === targetFileId;
    } catch {
      return false;
    }
  }

  private async reuploadAndRefreshOpenaiFileId(
    openai: OpenAI,
    userId: string,
    documentId: string,
    oldFileId: string,
  ): Promise<string> {
    const session = await this.uploadSessionCollection.findOne({
      userId,
      openaiFileId: oldFileId,
      status: 'completed',
    });
    if (!session?.gridFsFileId || !ObjectId.isValid(session.gridFsFileId)) {
      throw new BadRequestException(
        `invalid file_id and no source file found: ${oldFileId}`,
      );
    }

    const sourceFileObjectId = new ObjectId(session.gridFsFileId);
    const sourceBuffer = await this.readGridFsFileBuffer(sourceFileObjectId);
    const sourceFileName =
      String(session.fileName ?? '').trim() || `file-${Date.now()}`;
    const sourceMimeType =
      String(session.mimeType ?? '').trim() || 'application/octet-stream';

    const uploadableFile = await toFile(sourceBuffer, sourceFileName, {
      type: sourceMimeType,
    });
    const openaiFile = await openai.files.create({
      file: uploadableFile,
      purpose: 'assistants',
    });
    const newFileId = String(openaiFile?.id ?? '').trim();
    if (!newFileId) {
      throw new BadRequestException('re-upload file to openai failed');
    }

    await this.uploadSessionCollection.updateMany(
      { userId, openaiFileId: oldFileId },
      { $set: { openaiFileId: newFileId, updatedAt: new Date() } },
    );
    await this.fileMappingCollection.updateMany(
      { userId, $or: [{ openaiFileId: oldFileId }, { url: oldFileId }] },
      {
        $set: {
          openaiFileId: newFileId,
          url: newFileId,
          updateTime: new Date(),
        },
      },
    );
    await this.chatService.replaceOpenaiFileId(
      documentId,
      oldFileId,
      newFileId,
    );

    return newFileId;
  }

  private async readGridFsFileBuffer(fileObjectId: ObjectId): Promise<Buffer> {
    const stream = this.bucket.openDownloadStream(fileObjectId);
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(Buffer.from(chunk));
      });
      stream.on('error', (error) => reject(error));
      stream.on('end', () => resolve());
    });
    return Buffer.concat(chunks);
  }
}
