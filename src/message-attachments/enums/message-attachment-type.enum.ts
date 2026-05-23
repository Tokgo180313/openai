export const MESSAGE_ATTACHMENT_TYPES = [
  'input_image',
  'input_file',
  'output_image',
  'output_file',
] as const;
export type MessageAttachmentType = (typeof MESSAGE_ATTACHMENT_TYPES)[number];
