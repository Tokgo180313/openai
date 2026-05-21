/** /ai-model/findAiModelList 列表项 */
export interface AiModelItem {
  id: string;
  provider: string;
  modelCode: string;
  apiModelName: string;
  /** text / image / vision */
  modelType: string;
  baseUrl?: string | null;
  /** 1 启用 / 0 禁用 */
  enabled?: number | string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export const MODEL_TYPE_TEXT = "text";
export const MODEL_TYPE_IMAGE = "image";
export const MODEL_TYPE_VISION = "vision";

export const MODEL_TYPE_LABEL_MAP: Record<string, string> = {
  [MODEL_TYPE_TEXT]: "文本",
  [MODEL_TYPE_IMAGE]: "图片",
  [MODEL_TYPE_VISION]: "视觉",
};

export function getModelTypeLabel(modelType?: string): string {
  if (!modelType) return "-";
  return MODEL_TYPE_LABEL_MAP[modelType] ?? modelType;
}

export function isEnabledChatModel(item: AiModelItem): boolean {
  return String(item.enabled) === "1" && item.modelType === MODEL_TYPE_TEXT;
}
