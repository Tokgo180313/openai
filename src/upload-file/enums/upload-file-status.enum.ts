export const UPLOAD_FILE_STATUSES = ['temp', 'used', 'deleted'] as const;
export type UploadFileStatus = (typeof UPLOAD_FILE_STATUSES)[number];
