export const UPLOAD_FILE_SOURCES = [
  'user_upload',
  'ai_generated',
  'system_generated',
] as const;
export type UploadFileSource = (typeof UPLOAD_FILE_SOURCES)[number];
