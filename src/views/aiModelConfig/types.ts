import type { FieldMappingsDto } from "@/api/manage/aiModelConfig";

/** 列表行 / 详情表单数据源 */
export interface AiModelConfigRow {
  id: string;
  provider?: string;
  modelName?: string;
  displayName?: string;
  modelType?: string;
  apiUrl?: string;
  maxImageCount?: number;
  supportedAspectRatio?: string[];
  defaultAspectRatio?: string;
  supportedResolutions?: string[];
  defaultResolution?: string;
  supportedFormats?: string[];
  maxResolution?: string;
  fieldMappings?: FieldMappingsDto;
  defaultParams?: Record<string, unknown>;
  isEnabled?: boolean;
  sort?: number;
}
