export class StreamMessageDto {
  prompt: string;
  text?: string;
  model: string;
  baseURL?: string;
  /** @deprecated 请使用 provider */
  modelClassify?: string;
  provider?: string;
  role?: string;
  id?: string;
  titleId: string;
  documentId: string;
  userId: string;
  type?: 'input_text' | 'input_file' | 'input_url';
  input_url?: string;
  image_base64?: string;
  file_id?: string;
  openaiFileId?: string;
  gridFsFileId?: string;
  fileName?: string;
  mimeType?: string;
  fileUrl?: string;
}