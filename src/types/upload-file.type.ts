/** 与后端 upload_file 表及 UploadFile 实体对齐 */
export type UploadFileSource =
  | "user_upload"
  | "ai_generated"
  | "system_generated";

export type UploadFileStatus = "temp" | "used" | "deleted";

export type UploadFileType = "image" | "file" | "audio" | "video";

export interface UploadFileRecord {
  id: number;
  userId: string;
  source: UploadFileSource;
  fileType: UploadFileType;
  mimeType: string;
  originalName: string;
  storageName: string;
  storagePath: string;
  url: string | null;
  size: number;
  ext: string | null;
  hash: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  status: UploadFileStatus;
  metadata: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadFileSaveResult {
  fileId: number;
  url: string | null;
  record: UploadFileRecord;
}

export interface UploadFileQueryDto {
  currentPage?: number;
  pageSize?: number;
  status?: UploadFileStatus;
  fileType?: UploadFileType;
  source?: UploadFileSource;
  keyword?: string;
}

export interface UploadFileListResult {
  list: UploadFileRecord[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface UploadFileUpdateDto {
  id: string;
  status?: UploadFileStatus;
  source?: UploadFileSource;
  fileType?: UploadFileType;
  metadata?: Record<string, unknown> | null;
  duration?: number | null;
}

export const UPLOAD_FILE_STATUS_OPTIONS = [
  { value: "temp", label: "暂存" },
  { value: "used", label: "已使用" },
  { value: "deleted", label: "已删除" },
] as const;

export const UPLOAD_FILE_TYPE_OPTIONS = [
  { value: "image", label: "图片" },
  { value: "file", label: "文件" },
  { value: "audio", label: "音频" },
  { value: "video", label: "视频" },
] as const;

export const UPLOAD_FILE_SOURCE_OPTIONS = [
  { value: "user_upload", label: "用户上传" },
  { value: "ai_generated", label: "AI 生成" },
  { value: "system_generated", label: "系统生成" },
] as const;

export function formatFileSize(bytes?: number | null): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function getUploadStatusLabel(status?: string): string {
  return (
    UPLOAD_FILE_STATUS_OPTIONS.find((item) => item.value === status)?.label ??
    status ??
    "-"
  );
}

export function getUploadFileTypeLabel(fileType?: string): string {
  return (
    UPLOAD_FILE_TYPE_OPTIONS.find((item) => item.value === fileType)?.label ??
    fileType ??
    "-"
  );
}

export function getUploadSourceLabel(source?: string): string {
  return (
    UPLOAD_FILE_SOURCE_OPTIONS.find((item) => item.value === source)?.label ??
    source ??
    "-"
  );
}
