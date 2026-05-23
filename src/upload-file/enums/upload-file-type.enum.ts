export const UPLOAD_FILE_TYPES = ['image', 'file', 'audio', 'video'] as const;
export type UploadFileType = (typeof UPLOAD_FILE_TYPES)[number];
