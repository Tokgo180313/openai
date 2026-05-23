import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Collection, GridFSBucket, ObjectId } from 'mongodb';
import { readFile } from 'node:fs/promises';
import { inferUserContentInputType } from 'src/common/utils/user-input-type.util';
import { ChatService } from 'src/chat/chat.service';

export type InputFilePayload = {
  type: 'input_file';
  file_id: string;
};

export type InputImagePayload = {
  type: 'input_url';
  image_base64: string;
  mimeType?: string;
};

export type InputTextPayload = {
  type: 'input_text';
  text: string;
};

export type UserInputPayload =
  | InputFilePayload
  | InputImagePayload
  | InputTextPayload;

type UploadSessionDoc = {
  userId: string;
  fileName?: string;
  mimeType?: string;
  gridFsFileId?: string;
  openaiFileId?: string;
  status?: 'uploading' | 'completed';
};

@Injectable()
export class MessageAssemblyService implements OnModuleInit {
  private bucket: GridFSBucket;
  private uploadSessionCollection: Collection<UploadSessionDoc>;
  private fileMappingCollection: Collection;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly chatService: ChatService,
  ) {}

  onModuleInit() {
    const db = this.connection.db;
    if (!db) {
      throw new Error('mongodb connection is not initialized');
    }
    this.bucket = new GridFSBucket(db, { bucketName: 'uploaded_files' });
    this.uploadSessionCollection =
      db.collection<UploadSessionDoc>('upload_sessions');
    this.fileMappingCollection = db.collection('files');
  }

  normalizeRole(role: string | undefined): 'system' | 'assistant' | 'user' {
    const r = String(role ?? '')
      .trim()
      .toLowerCase();
    if (r === 'system') return 'system';
    if (r === 'assistant') return 'assistant';
    return 'user';
  }

  async buildMessagesFromHistory(
    openai: OpenAI,
    userId: string,
    documentId: string,
  ): Promise<OpenAI.ChatCompletionMessageParam[]> {
    const history = await this.chatService.chatList(documentId);
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    for (const item of history) {
      const role = this.normalizeRole(item.role);
      if (role === 'assistant' || role === 'system') {
        const contentText = String(item.content ?? '').trim();
        if (contentText) {
          messages.push({ role, content: contentText });
        }
        continue;
      }
      const content = await this.buildUserMessageContent(
        openai,
        userId,
        documentId,
        item,
      );
      if (content.length > 0) {
        messages.push({ role, content: content as any });
      }
    }
    return this.mergeMessagesByRole(messages);
  }

  toOpenAIChatMessages(
    messages: OpenAI.ChatCompletionMessageParam[],
  ): OpenAI.ChatCompletionMessageParam[] {
    return messages
      .map((message) => {
        const role = (message.role ?? 'user') as
          | 'system'
          | 'assistant'
          | 'user';
        const rawContent = (message as any).content;
        if (typeof rawContent === 'string') {
          return { role, content: rawContent } as OpenAI.ChatCompletionMessageParam;
        }
        if (!Array.isArray(rawContent)) {
          return null;
        }
        const parts: OpenAI.ChatCompletionContentPart[] = [];
        for (const item of rawContent as UserInputPayload[]) {
          if (!item || typeof item !== 'object') continue;
          if (item.type === 'input_text') {
            const text = String((item as InputTextPayload).text ?? '').trim();
            if (text) parts.push({ type: 'text', text });
            continue;
          }
          if (item.type === 'input_url') {
            const img = item as InputImagePayload;
            const base64 = String(img.image_base64 ?? '').trim();
            if (base64) {
              const mime = String(img.mimeType ?? '').trim() || 'image/png';
              parts.push({
                type: 'image_url',
                image_url: { url: `data:${mime};base64,${base64}` },
              });
            }
            continue;
          }
          if (item.type === 'input_file') {
            const fileId = String(
              (item as InputFilePayload).file_id ?? '',
            ).trim();
            if (fileId) {
              parts.push({ type: 'text', text: `file_id:${fileId}` });
            }
          }
        }
        if (parts.length === 0) return null;
        return { role, content: parts } as OpenAI.ChatCompletionMessageParam;
      })
      .filter(Boolean) as OpenAI.ChatCompletionMessageParam[];
  }

  private mergeMessagesByRole(
    messages: OpenAI.ChatCompletionMessageParam[],
  ): OpenAI.ChatCompletionMessageParam[] {
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
        fileId = await this.reuploadAndRefreshOpenaiFileId(
          openai,
          userId,
          documentId,
          fileId,
        );
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
      if (text) return [{ type: 'input_text', text }];
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
    if (!raw) return '';
    return raw.replace(/^data:[^;]+;base64,/i, '');
  }

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
          if (!res.ok) return empty;
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

  private async isFileValid(openai: OpenAI, fileId: string): Promise<boolean> {
    const targetFileId = String(fileId ?? '').trim();
    if (!targetFileId) return false;
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
      stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (error) => reject(error));
      stream.on('end', () => resolve());
    });
    return Buffer.concat(chunks);
  }
}
