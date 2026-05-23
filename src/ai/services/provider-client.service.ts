import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { ProviderService } from 'src/provider/provider.service';
import {
  normalizeOpenAIBaseURL,
  OPENAI_DEFAULT_BASE_URL,
} from 'src/common/utils/openai-base-url.util';

export type ResolvedOpenAiClient = {
  openai: OpenAI;
  apiKey: string;
  baseURL: string;
  model: string;
};

@Injectable()
export class ProviderClientService {
  constructor(
    private readonly configService: ConfigService,
    private readonly providerService: ProviderService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /** 从 provider 表解析密钥与 baseURL（流式聊天主路径） */
  async resolveFromProvider(
    provider: string,
    model: string,
  ): Promise<ResolvedOpenAiClient> {
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
    const openai = new OpenAI({ apiKey, baseURL });
    return {
      openai,
      apiKey,
      baseURL,
      model: String(model ?? '').trim() || 'gpt-4o-mini',
    };
  }

  /** 环境变量 OpenAI（/chat/chatgpt 兼容路径） */
  resolveFromEnv(model: string): ResolvedOpenAiClient {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('OPENAI_API_KEY is not set');
    }
    const rawBase =
      this.configService.get<string>('OPENAI_BASE_URL') ??
      process.env['OPENAI_BASE_URL'];
    const baseURL = normalizeOpenAIBaseURL(rawBase) ?? OPENAI_DEFAULT_BASE_URL;
    const openai = new OpenAI({ apiKey, baseURL });
    return {
      openai,
      apiKey,
      baseURL,
      model: String(model ?? '').trim() || 'gpt-4o-mini',
    };
  }
}
