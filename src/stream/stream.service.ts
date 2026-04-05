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

/** OpenAI SDK 会在 baseURL 后拼接 `/chat/completions`；若 OPENAI_BASE_URL 已含该路径会导致 404。 */
function normalizeOpenAIBaseURL(raw: string | undefined): string | undefined {
  if (raw == null || typeof raw !== 'string') return undefined;
  let u = raw.trim();
  if (!u) return undefined;
  while (/\/chat\/completions\/?$/i.test(u)) {
    u = u.replace(/\/chat\/completions\/?$/i, '');
  }
  u = u.replace(/\/+$/, '');
  return u || undefined;
}

const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';

@Injectable()
export class StreamService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  constructor(
    private configService: ConfigService,
    private readonly keyService: KeyService,
    private readonly encryptionService: EncryptionService,
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
    console.log(dto);

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

    const baseURL =
      normalizeOpenAIBaseURL(rawBase) ?? OPENAI_DEFAULT_BASE_URL;

    const model =
      String(dto?.model ?? '').trim() || 'gpt-4o-mini';

    const openai = new OpenAI({ apiKey, baseURL });

    const role = String(dto?.role ?? 'user').toLowerCase();
    const safeRole =
      role === 'system' || role === 'assistant' || role === 'user'
        ? role
        : 'user';

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
}
