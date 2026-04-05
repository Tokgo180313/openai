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

    // 先落库本轮用户消息，再按 documentId 拉全量会话拼 messages
    await this.saveRequest(
      prompt,
      model,
      dto.userId,
      dto.titleId,
      documentId,
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

    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of stream) {
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
