export class ProviderDto {
  apiKey: string;
  provider: string;
  baseURL: string;
}

export class ProviderQueryDto {
  provider?: string;
  baseURL?: string;
}

export class ProviderUpdateDto {
  apiKey?: string;
  provider?: string;
  baseURL?: string;
}
