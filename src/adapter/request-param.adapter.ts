import { BadRequestException, Injectable } from '@nestjs/common';
import type OpenAI from 'openai';
import type { FieldMappingsJson } from 'src/aiModelConfig/entities/ai-model-config.entity';
import {
  LINKFOX_PROVIDER_BANANA_2,
  resolveRequestParamFormat,
  SERVICE_PRODUCT_147AI,
} from './adapter.constants';
import type {
  AdaptedImageRequest,
  ImageGenerateAdapterInput,
  LinkfoxImageRequestBody,
  OpenAiImageChatRequestBody,
} from './adapter.types';

function pickString(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

function pickPositiveInt(v: unknown, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

/** 将 modelName / 服务商品 映射为 linkfox 的 provider 字段 */
export function inferLinkfoxProvider(
  modelName: string,
  serviceProduct?: string,
  explicit?: string,
): string {
  const fromExplicit = pickString(explicit);
  if (fromExplicit) return fromExplicit.toUpperCase();

  const mn = String(modelName ?? '').trim().toLowerCase();
  if (mn.includes('banana')) return LINKFOX_PROVIDER_BANANA_2;
  if (mn.includes('nano')) return 'NANO';

  const sp = String(serviceProduct ?? '').trim().toLowerCase();
  if (sp.includes('banana')) return LINKFOX_PROVIDER_BANANA_2;

  return LINKFOX_PROVIDER_BANANA_2;
}

function applyFieldKey(
  target: Record<string, unknown>,
  mappings: FieldMappingsJson | undefined,
  canonical: keyof FieldMappingsJson,
  value: unknown,
) {
  const key = pickString(mappings?.[canonical]) ?? canonical;
  target[key] = value;
}

@Injectable()
export class RequestParamAdapterService {
  /**
   * 按服务商品选择 OpenAI 或 linkfox 请求体。
   * - 147ai（Nano / Banana 2）：OpenAI messages + image_url
   * - linkfox 图片模型：imageList + prompt + provider + outputNum + resolution
   */
  adaptImageGenerate(input: ImageGenerateAdapterInput): AdaptedImageRequest {
    const format = resolveRequestParamFormat(input.serviceProduct, {
      compatibleWithOpenAi: input.compatibleWithOpenAi,
    });

    if (format === 'openai') {
      return { format: 'openai', body: this.buildOpenAiBody(input) };
    }
    return { format: 'linkfox', body: this.buildLinkfoxBody(input) };
  }

  buildOpenAiBody(
    input: ImageGenerateAdapterInput,
  ): OpenAiImageChatRequestBody {
    const prompt = String(input.prompt ?? '').trim();
    if (!prompt) {
      throw new BadRequestException('prompt is required');
    }
    const model = String(input.modelName ?? '').trim();
    if (!model) {
      throw new BadRequestException('modelName is required');
    }

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      { type: 'text', text: prompt },
    ];

    const images = (input.imageDataUrls ?? [])
      .map((u) => String(u ?? '').trim())
      .filter(Boolean);
    for (const url of images) {
      content.push({
        type: 'image_url',
        image_url: { url },
      });
    }

    const body: OpenAiImageChatRequestBody = {
      model,
      stream: false,
      messages: [{ role: 'user', content }],
    };

    const aspectRatio = pickString(input.aspectRatio);
    const imageSize = pickString(input.imageSize);
    if (aspectRatio || imageSize) {
      body.extra_body = {
        google: {
          image_config: {
            ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
            ...(imageSize ? { image_size: imageSize } : {}),
          },
        },
      };
    }

    return body;
  }

  buildLinkfoxBody(
    input: ImageGenerateAdapterInput,
  ): LinkfoxImageRequestBody {
    const prompt = String(input.prompt ?? '').trim();
    if (!prompt) {
      throw new BadRequestException('prompt is required');
    }

    const imageList = (input.imageHttpUrls ?? [])
      .map((u) => String(u ?? '').trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'));
    if (imageList.length === 0 && (input.imageHttpUrls ?? []).length > 0) {
      throw new BadRequestException(
        'linkfox imageList requires http(s) image URLs',
      );
    }

    const resolution =
      pickString(input.imageSize) ??
      pickString(input.defaultParams?.resolution) ??
      '2K';

    const outputNum = pickPositiveInt(
      input.outputNum ?? input.defaultParams?.outputNum,
      1,
    );

    const provider = inferLinkfoxProvider(
      input.modelName,
      input.serviceProduct,
      input.linkfoxProvider ??
        pickString(input.defaultParams?.provider),
    );

    const body: LinkfoxImageRequestBody = {
      imageList,
      prompt,
      provider,
      outputNum,
      resolution,
    };

    const mappings = input.fieldMappings;
    if (mappings && Object.keys(mappings).length > 0) {
      const mapped: LinkfoxImageRequestBody = {};
      applyFieldKey(mapped, mappings, 'imageList', imageList);
      applyFieldKey(mapped, mappings, 'prompt', prompt);
      applyFieldKey(mapped, mappings, 'model', provider);
      mapped.provider = provider;
      mapped.outputNum = outputNum;
      mapped.resolution = resolution;
      Object.assign(body, mapped);
    }

    if (input.defaultParams) {
      for (const [k, v] of Object.entries(input.defaultParams)) {
        if (body[k] === undefined) body[k] = v;
      }
    }

    return body;
  }

  /** 147ai 服务商品是否应走 OpenAI 格式（便于调用方校验） */
  is147AiProduct(serviceProduct: string): boolean {
    return (
      resolveRequestParamFormat(serviceProduct) === 'openai' &&
      String(serviceProduct ?? '')
        .trim()
        .toLowerCase()
        .includes(SERVICE_PRODUCT_147AI)
    );
  }
}
