import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  AiAdapter,
  AiAdapterRequest,
  AiAdapterResponse,
} from '../interfaces/ai-adapter.interface';
import { Provider } from '../enums/provider.enum';
import { ProviderClientService } from '../services/provider-client.service';

@Injectable()
export class OpenAiAdapter implements AiAdapter {
  readonly provider = Provider.OPENAI;

  constructor(private readonly providerClient: ProviderClientService) {}

  async createClient(
    provider: string,
    model: string,
  ): Promise<{ openai: OpenAI; model: string; baseURL: string }> {
    const resolved = await this.providerClient.resolveFromProvider(
      provider,
      model,
    );
    return {
      openai: resolved.openai,
      model: resolved.model,
      baseURL: resolved.baseURL,
    };
  }

  async adaptRequest<TBody = Record<string, unknown>>(
    input: AiAdapterRequest<TBody>,
  ): Promise<Record<string, unknown>> {
    return {
      model: input.apiModelName,
      ...input.body,
    };
  }

  adaptResponse<TData = unknown>(raw: unknown): AiAdapterResponse<TData> {
    return { data: raw as TData };
  }
}
