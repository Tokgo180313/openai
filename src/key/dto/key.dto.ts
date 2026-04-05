export class KeyDto {
  apiKey: string;
  modelClassify: string;
  baseURL: string;
}

export class KeyQueryDto {
  modelClassify?: string;
  baseURL?: string;
}

export class KeyUpdateDto {
  apiKey?: string;
  modelClassify?: string;
  baseURL?: string;
}

