import type { Provider } from '../enums/provider.enum';

export interface AiAdapterRequest<TBody = Record<string, unknown>> {
  provider: Provider | string;
  apiModelName: string;
  baseUrl?: string;
  body: TBody;
}

export interface AiAdapterResponse<TData = unknown> {
  data: TData;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface AiAdapter {
  readonly provider: Provider | string;
  adaptRequest<TBody = Record<string, unknown>>(
    input: AiAdapterRequest<TBody>,
  ): Promise<Record<string, unknown>>;
  adaptResponse<TData = unknown>(
    raw: unknown,
  ): AiAdapterResponse<TData>;
}
