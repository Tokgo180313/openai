export const MESSAGE_ATTACHMENT_ROLES = ['user', 'assistant'] as const;
export type MessageAttachmentRole = (typeof MESSAGE_ATTACHMENT_ROLES)[number];
