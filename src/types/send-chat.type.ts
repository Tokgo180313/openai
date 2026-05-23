export interface ChatAttachment {
  id?: string;
  type: "image" | "file";
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
}

/** POST /ai/stream 请求体 */
export interface SendChatDto {
  /** 新建对话时为 null，流式结束后由后端返回真实 titleId */
  titleId?: string | null;
  modelCode: string;
  content: string;
  attachments?: ChatAttachment[];
  params?: Record<string, unknown>;
  stream?: boolean;
  /** 临时对话消息 ID */
  clientMessageId?: string;
}
