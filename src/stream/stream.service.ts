import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { KeyService } from 'src/key/key.service';
import { StreamMessageDto } from './dto/stream.dto';
import {
  normalizeOpenAIBaseURL,
  OPENAI_DEFAULT_BASE_URL,
} from 'src/common/utils/openai-base-url.util';
import { ChatService } from 'src/chat/chat.service';
import { ChatEntity } from 'src/chat/entity/Chat.entity';
import { ContentEntity } from 'src/chat/entity/ContentEntity';

/** 流结束后由 streamGenerateContentByOpenAI 写入 OpenAI 返回的 usage（若网关支持） */
export type StreamCompletionUsageOut = {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

@Injectable()
export class StreamService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly abortControllers = new Map<string, AbortController>();
  private readonly stoppedKeys = new Set<string>();
  constructor(
    private configService: ConfigService,
    private readonly keyService: KeyService,
    private readonly encryptionService: EncryptionService,
    private readonly chatService: ChatService,
  ) {}
  onModuleInit() {
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
    dto: StreamMessageDto,
    usageOut?: StreamCompletionUsageOut,
  ): AsyncGenerator<string> {
    const prompt = String(dto?.prompt ?? '').trim();
    if (!prompt) {
      throw new BadRequestException('prompt is required');
    }
    const documentId = String(dto?.documentId ?? '').trim();
    if (!documentId) {
      throw new BadRequestException('documentId is required');
    }
    const modelClassify = String(dto?.modelClassify ?? '').trim();
    if (!modelClassify) {
      throw new BadRequestException('modelClassify is required');
    }

    const keyDoc = await this.keyService.findKeyByModelClassify(modelClassify);
    if (!keyDoc?.apiKey) {
      throw new NotFoundException(
        `no api key configured for modelClassify: ${modelClassify}`,
      );
    }
    const rawBase = String(keyDoc.baseURL ?? '').trim();
    if (!rawBase) {
      throw new NotFoundException(
        `no baseURL configured for modelClassify: ${modelClassify}`,
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
      const r = String(role ?? '').trim().toLowerCase();
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
      prompt,
      model,
      dto.userId,
      dto.titleId,
      documentId,
      apiKey,
      baseURL,
    );

    const history = await this.chatService.chatList(documentId);
    const messages: OpenAI.ChatCompletionMessageParam[] = history
      .map((item) => ({
        role: normalizeRole(item.role),
        content: String(item.content ?? '').trim(),
      }))
      .filter((m) => !!m.content);

    if (messages.length === 0) {
      throw new BadRequestException('messages is empty');
    }

    try {
      const stream = await openai.chat.completions.create(
        {
          model,
          messages,
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
    prompt: string,
    model: string,
    userId: string,
    titleId: string,
    documentId: string,
    apiKey: string,
    baseURL: string,
  ) {
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
        title = String(titleResponse.choices?.[0]?.message?.content ?? '').trim();
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
    const content: ContentEntity = {
      role: 'user',
      content: prompt,
      useModel: model,
      documentId: documentId,
    };
    await this.chatService.addNewContent(content);
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
}
