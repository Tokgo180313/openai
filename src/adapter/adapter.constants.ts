/** 服务商品：147ai（Nano / Banana 2 等，走 OpenAI Chat Completions 协议） */
export const SERVICE_PRODUCT_147AI = '147ai';

/** 服务商品：linkfox 图片模型 */
export const SERVICE_PRODUCT_LINKFOX = 'linkfox';

export type RequestParamFormat = 'openai' | 'linkfox';

const NORMALIZE = (s: string) => String(s ?? '').trim().toLowerCase();

/** 根据服务商品 / 模型配置判断请求体格式 */
export function resolveRequestParamFormat(
  serviceProduct: string,
  options?: { compatibleWithOpenAi?: boolean },
): RequestParamFormat {
  const key = NORMALIZE(serviceProduct);
  if (!key) {
    return options?.compatibleWithOpenAi ? 'openai' : 'linkfox';
  }
  if (key === SERVICE_PRODUCT_LINKFOX || key.includes('linkfox')) {
    return 'linkfox';
  }
  if (
    key === SERVICE_PRODUCT_147AI ||
    key.includes('147ai') ||
    key === '147'
  ) {
    return 'openai';
  }
  if (options?.compatibleWithOpenAi) {
    return 'openai';
  }
  return 'linkfox';
}

/** linkfox 请求体中的 provider 枚举（与上游约定） */
export const LINKFOX_PROVIDER_BANANA_2 = 'BANANA_2';
