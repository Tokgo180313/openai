import type { MessageAttachmentRole } from '../enums/message-attachment-role.enum';
import type { MessageAttachmentType } from '../enums/message-attachment-type.enum';

/** 根据角色与文件大类推断 attachment_type */
export function inferMessageAttachmentType(
  role: MessageAttachmentRole,
  fileKind: 'image' | 'file' | string,
): MessageAttachmentType {
  const isImage = String(fileKind ?? '').trim().toLowerCase() === 'image';
  if (role === 'user') {
    return isImage ? 'input_image' : 'input_file';
  }
  return isImage ? 'output_image' : 'output_file';
}
