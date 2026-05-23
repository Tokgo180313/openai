import { Injectable } from '@nestjs/common';
import type {
  AiAdapter,
  AiAdapterRequest,
  AiAdapterResponse,
} from '../interfaces/ai-adapter.interface';
import { Provider } from '../enums/provider.enum';

@Injectable()
export class LinkfoxAdapter implements AiAdapter {
  readonly provider = Provider.LINKFOX;

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
