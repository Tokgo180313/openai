import { BadRequestException } from '@nestjs/common';
import type { ChatAttachmentDto } from '../dto/chat-attachment.dto';
import type { SendChatDto } from '../dto/send-chat.dto';
import type { ContentEntity } from 'src/chat/entity/ContentEntity';

export function normalizeChatAttachments(
  attachments?: ChatAttachmentDto[],
): ChatAttachmentDto[] {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .map((item) => ({
      id: String(item?.id ?? '').trim() || undefined,
      type: item?.type,
      name: String(item?.name ?? '').trim(),
      url: String(item?.url ?? '').trim(),
      mimeType: String(item?.mimeType ?? '').trim() || undefined,
      size:
        item?.size != null && Number.isFinite(Number(item.size))
          ? Number(item.size)
          : undefined,
    }))
    .filter((item) => item.name && item.url && item.type);
}

export function assertSendChatPayload(dto: SendChatDto): {
  content: string;
  attachments: ChatAttachmentDto[];
} {
  const content = String(dto?.content ?? '').trim();
  const attachments = normalizeChatAttachments(dto.attachments);
  if (!content && attachments.length === 0) {
    throw new BadRequestException('content or attachments is required');
  }
  return { content, attachments };
}

export function attachmentToContentEntity(
  attachment: ChatAttachmentDto,
  documentId: string,
  useModel: string,
): ContentEntity {
  const url = String(attachment.url ?? '').trim();
  const name = String(attachment.name ?? '').trim();
  const mimeType = String(attachment.mimeType ?? '').trim() || undefined;
  const fileId = String(attachment.id ?? '').trim() || undefined;

  if (attachment.type === 'image') {
    return {
      role: 'user',
      content: name || '[image]',
      useModel,
      documentId,
      type: 'input_url',
      input_url: url,
      fileUrl: url,
      fileName: name,
      mimeType,
    };
  }

  return {
    role: 'user',
    content: name || '[file]',
    useModel,
    documentId,
    type: 'input_file',
    openaiFileId: fileId,
    fileUrl: url,
    fileName: name,
    mimeType,
  };
}

export function titleSeedFromPayload(
  content: string,
  attachments: ChatAttachmentDto[],
): string {
  if (content) return content.slice(0, 30);
  const first = attachments[0];
  return String(first?.name ?? first?.url ?? '新对话').slice(0, 30);
}
