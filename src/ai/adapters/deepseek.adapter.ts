import { Injectable } from '@nestjs/common';
import type {
  AiAdapter,
  AiAdapterRequest,
  AiAdapterResponse,
} from '../interfaces/ai-adapter.interface';
import { Provider } from '../enums/provider.enum';
import { OpenAiAdapter } from './openai.adapter';

/** DeepSeek 使用 OpenAI 兼容协议 */
@Injectable()
export class DeepseekAdapter implements AiAdapter {
  readonly provider = Provider.DEEPSEEK;

  constructor(private readonly openAiAdapter: OpenAiAdapter) {}

  createClient(provider: string, model: string) {
    return this.openAiAdapter.createClient(provider, model);
  }

  adaptRequest<TBody = Record<string, unknown>>(
    input: AiAdapterRequest<TBody>,
  ): Promise<Record<string, unknown>> {
    return this.openAiAdapter.adaptRequest(input);
  }

  adaptResponse<TData = unknown>(raw: unknown): AiAdapterResponse<TData> {
    return this.openAiAdapter.adaptResponse<TData>(raw);
  }
}
