/** /model/findModelList 列表项 */
export interface ModelItem {
  id: string;
  modelName: string;
  modelClassify?: string;
  /** chat | image_edit */
  modelType?: string;
  status?: string | number;
  createdAt?: string;
  [key: string]: unknown;
}

export const MODEL_TYPE_CHAT = "chat";
export const MODEL_TYPE_IMAGE_EDIT = "image_edit";

export const MODEL_TYPE_LABEL_MAP: Record<string, string> = {
  [MODEL_TYPE_CHAT]: "聊天",
  [MODEL_TYPE_IMAGE_EDIT]: "图片编辑",
};

export function getModelTypeLabel(modelType?: string): string {
  if (!modelType) return "-";
  return MODEL_TYPE_LABEL_MAP[modelType] ?? modelType;
}

export function isEnabledChatModel(item: ModelItem): boolean {
  return String(item.status) === "1" && item.modelType === MODEL_TYPE_CHAT;
}
