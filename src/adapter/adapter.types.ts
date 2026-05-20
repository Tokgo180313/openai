import type OpenAI from 'openai';
import type { FieldMappingsJson } from 'src/aiModelConfig/entities/ai-model-config.entity';
import type { RequestParamFormat } from './adapter.constants';

/** 统一的图片生成入参（业务层 → 适配器） */
export type ImageGenerateAdapterInput = {
  /** 服务商品，如 147ai、linkfox */
  serviceProduct: string;
  modelName: string;
  prompt: string;
  /** OpenAI 多模态：data URL 或 http(s) 图片地址 */
  imageDataUrls?: string[];
  /** linkfox：必须为可访问的 http(s) 图片 URL 列表 */
  imageHttpUrls?: string[];
  aspectRatio?: string;
  imageSize?: string;
  outputNum?: number;
  /** linkfox 上游 provider，如 BANANA_2；缺省由 modelName 推断 */
  linkfoxProvider?: string;
  fieldMappings?: FieldMappingsJson;
  defaultParams?: Record<string, unknown>;
  compatibleWithOpenAi?: boolean;
};

export type OpenAiImageChatRequestBody = {
  model: string;
  stream: false;
  messages: Array<{
    role: 'user';
    content: OpenAI.Chat.ChatCompletionContentPart[];
  }>;
  extra_body?: {
    google?: {
      image_config?: {
        aspect_ratio?: string;
        image_size?: string;
      };
    };
  };
};

/** linkfox 默认字段；fieldMappings 可将键名映射为上游实际字段名 */
export type LinkfoxImageRequestBody = Record<string, unknown> & {
  imageList?: string[];
  prompt?: string;
  provider?: string;
  outputNum?: number;
  resolution?: string;
};

export type AdaptedImageRequest =
  | { format: 'openai'; body: OpenAiImageChatRequestBody }
  | { format: 'linkfox'; body: LinkfoxImageRequestBody };

export type { RequestParamFormat };
