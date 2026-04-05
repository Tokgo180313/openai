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
@Injectable()
export class StreamService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
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
  ): AsyncGenerator<string> {
    const prompt = String(dto?.prompt ?? '').trim();
    if (!prompt) {
      throw new BadRequestException('prompt is required');
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

    const role = String(dto?.role ?? 'user').toLowerCase();
    const safeRole =
      role === 'system' || role === 'assistant' || role === 'user'
        ? role
        : 'user';
    // 保存请求
    await this.saveRequest(prompt, model,dto.userId, dto.titleId, dto.documentId);
    const stream = await openai.chat.completions.create({
      model,
      messages: [{ role: safeRole as any, content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const piece = chunk.choices[0]?.delta?.content;
      if (piece) {
        yield piece;
      }
    }
  }

  public async saveRequest(prompt: string, model: string, userId: string, titleId: string, documentId: string) {
    if (!titleId) {    
      let chatEntity = new ChatEntity({
        userId: userId,
        documentId: documentId,
        title: prompt ,
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
