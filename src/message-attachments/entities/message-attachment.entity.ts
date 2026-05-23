import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { MessageAttachmentRole } from '../enums/message-attachment-role.enum';
import type { MessageAttachmentType } from '../enums/message-attachment-type.enum';

/** 消息与上传文件的关联表：记录某条消息引用了哪些文件及其角色 */
@Entity('message_attachment', { comment: '消息附件关联表' })
@Index('idx_message_attachment_message', ['messageId'])
@Index('idx_message_attachment_file', ['fileId'])
export class MessageAttachment {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
  id: number;

  @Column({
    name: 'message_id',
    type: 'varchar',
    length: 24,
    comment: '关联消息 ID（MongoDB Content._id）',
  })
  messageId: string;

  @Column({
    name: 'file_id',
    type: 'bigint',
    comment: '关联 upload_file.id',
  })
  fileId: number;

  @Column({
    name: 'attachment_type',
    type: 'varchar',
    length: 32,
    comment:
      '附件类型：input_image、input_file、output_image、output_file',
  })
  attachmentType: MessageAttachmentType;

  @Column({
    type: 'varchar',
    length: 16,
    comment: '消息侧角色：user 用户输入、assistant 助手输出',
  })
  role: MessageAttachmentRole;

  @Column({
    name: 'sort_order',
    type: 'int',
    default: 0,
    comment: '同一条消息多附件时的排序',
  })
  sortOrder: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: '扩展元数据（JSON）',
  })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;
}
