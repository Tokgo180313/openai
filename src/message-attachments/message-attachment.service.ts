import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { UploadFile } from 'src/upload-file/entities/upload-file.entity';
import {
  MessageAttachmentBatchCreateDto,
  MessageAttachmentItemDto,
  MessageAttachmentUpdateDto,
} from './dto/message-attachment.dto';
import { MessageAttachment } from './entities/message-attachment.entity';
import type { MessageAttachmentRole } from './enums/message-attachment-role.enum';
import type { MessageAttachmentType } from './enums/message-attachment-type.enum';
import { inferMessageAttachmentType } from './utils/infer-attachment-type.util';

export type MessageAttachmentWithFile = MessageAttachment & {
  file?: UploadFile | null;
};

@Injectable()
export class MessageAttachmentService {
  constructor(
    @InjectRepository(MessageAttachment)
    private readonly attachmentRepo: Repository<MessageAttachment>,
    @InjectRepository(UploadFile)
    private readonly uploadFileRepo: Repository<UploadFile>,
  ) {}

  async batchCreate(
    dto: MessageAttachmentBatchCreateDto,
    userId: string,
  ): Promise<MessageAttachment[]> {
    const rows: MessageAttachment[] = [];
    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i];
      rows.push(
        await this.createOne(
          item,
          userId,
          item.sortOrder ?? i,
        ),
      );
    }
    return rows;
  }

  async createOne(
    item: MessageAttachmentItemDto,
    userId: string,
    sortOrder?: number,
  ): Promise<MessageAttachment> {
    const messageId = this.parseMessageId(item.messageId);
    const fileId = this.parseFileId(item.fileId);
    await this.assertFileOwned(fileId, userId);

    const entity = this.attachmentRepo.create({
      messageId,
      fileId,
      attachmentType: item.attachmentType as MessageAttachmentType,
      role: item.role as MessageAttachmentRole,
      sortOrder: sortOrder ?? item.sortOrder ?? 0,
      metadata: item.metadata ?? null,
    });
    return await this.attachmentRepo.save(entity);
  }

  /**
   * 为一条消息关联上传文件（自动推断 attachment_type，可选标记文件为 used）
   */
  async linkFilesToMessage(input: {
    messageId: string;
    fileIds: number[];
    role: MessageAttachmentRole;
    userId: string;
    markFileUsed?: boolean;
    metadata?: Record<string, unknown> | null;
  }): Promise<MessageAttachment[]> {
    const messageId = this.parseMessageId(input.messageId);
    const uniqueFileIds = [
      ...new Set(
        input.fileIds.filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];
    if (uniqueFileIds.length === 0) {
      return [];
    }

    const files = await this.uploadFileRepo.find({
      where: { id: In(uniqueFileIds), userId: input.userId },
    });
    if (files.length !== uniqueFileIds.length) {
      throw new NotFoundException('upload file not found');
    }

    const fileById = new Map(files.map((f) => [f.id, f]));
    const rows: MessageAttachment[] = [];

    for (let i = 0; i < uniqueFileIds.length; i++) {
      const fileId = uniqueFileIds[i];
      const file = fileById.get(fileId)!;
      const entity = this.attachmentRepo.create({
        messageId,
        fileId,
        attachmentType: inferMessageAttachmentType(input.role, file.fileType),
        role: input.role,
        sortOrder: i,
        metadata: input.metadata ?? null,
      });
      rows.push(await this.attachmentRepo.save(entity));

      if (input.markFileUsed && file.status === 'temp') {
        file.status = 'used';
        await this.uploadFileRepo.save(file);
      }
    }

    return rows;
  }

  async findByMessageIds(
    messageIds: string[],
    userId: string,
  ): Promise<Map<string, MessageAttachmentWithFile[]>> {
    const mids = [
      ...new Set(
        messageIds
          .map((id) => String(id ?? '').trim())
          .filter((id) => /^[a-fA-F0-9]{24}$/.test(id)),
      ),
    ];
    const result = new Map<string, MessageAttachmentWithFile[]>();
    if (mids.length === 0) {
      return result;
    }

    const list = await this.attachmentRepo.find({
      where: { messageId: In(mids) },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    if (list.length === 0) {
      return result;
    }

    const fileIds = [...new Set(list.map((r) => r.fileId))];
    const files = await this.uploadFileRepo.find({
      where: { id: In(fileIds), userId },
    });
    const fileMap = new Map(files.map((f) => [f.id, f]));

    for (const row of list) {
      const file = fileMap.get(row.fileId);
      if (!file) continue;
      const enriched: MessageAttachmentWithFile = { ...row, file };
      const bucket = result.get(row.messageId) ?? [];
      bucket.push(enriched);
      result.set(row.messageId, bucket);
    }
    return result;
  }

  async findByMessageId(
    messageId: string,
    userId: string,
  ): Promise<MessageAttachmentWithFile[]> {
    const mid = this.parseMessageId(messageId);
    const list = await this.attachmentRepo.find({
      where: { messageId: mid },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    if (list.length === 0) {
      return [];
    }

    const fileIds = [...new Set(list.map((r) => r.fileId))];
    const files = await this.uploadFileRepo.find({
      where: { id: In(fileIds), userId },
    });
    const fileMap = new Map(files.map((f) => [f.id, f]));

    return list.map((row) => ({
      ...row,
      file: fileMap.get(row.fileId) ?? null,
    }));
  }

  async findById(
    id: number,
    userId: string,
  ): Promise<MessageAttachmentWithFile> {
    const row = await this.attachmentRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('message attachment not found');
    }
    const file = await this.uploadFileRepo.findOne({
      where: { id: row.fileId, userId },
    });
    if (!file) {
      throw new NotFoundException('message attachment not found');
    }
    return { ...row, file };
  }

  async update(
    dto: MessageAttachmentUpdateDto,
    userId: string,
  ): Promise<MessageAttachment> {
    const id = this.parseAttachmentId(dto.id);
    const row = await this.findOwnedRowOrThrow(id, userId);

    if (dto.sortOrder !== undefined) {
      row.sortOrder = dto.sortOrder;
    }
    if (dto.metadata !== undefined) {
      row.metadata = dto.metadata;
    }

    return await this.attachmentRepo.save(row);
  }

  async deleteById(id: number, userId: string): Promise<void> {
    await this.findOwnedRowOrThrow(id, userId);
    await this.attachmentRepo.delete({ id });
  }

  async deleteByMessageId(messageId: string, userId: string): Promise<void> {
    const mid = this.parseMessageId(messageId);
    const list = await this.attachmentRepo.find({ where: { messageId: mid } });
    if (list.length === 0) {
      return;
    }
    const fileIds = [...new Set(list.map((r) => r.fileId))];
    const ownedCount = await this.uploadFileRepo.count({
      where: { id: In(fileIds), userId },
    });
    if (ownedCount !== fileIds.length) {
      throw new NotFoundException('message attachment not found');
    }
    await this.attachmentRepo.delete({ messageId: mid });
  }

  private async findOwnedRowOrThrow(
    id: number,
    userId: string,
  ): Promise<MessageAttachment> {
    const row = await this.attachmentRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('message attachment not found');
    }
    await this.assertFileOwned(row.fileId, userId);
    return row;
  }

  private async assertFileOwned(fileId: number, userId: string): Promise<void> {
    const file = await this.uploadFileRepo.findOne({
      where: { id: fileId, userId },
    });
    if (!file || file.status === 'deleted') {
      throw new NotFoundException('upload file not found');
    }
  }

  private parseMessageId(raw: string): string {
    const id = String(raw ?? '').trim();
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      throw new BadRequestException('invalid message id');
    }
    return id;
  }

  private parseFileId(raw: string): number {
    const id = parsePositiveIntId(raw);
    if (!id) {
      throw new BadRequestException('invalid file id');
    }
    return id;
  }

  private parseAttachmentId(raw: string): number {
    const id = parsePositiveIntId(raw);
    if (!id) {
      throw new BadRequestException('invalid attachment id');
    }
    return id;
  }
}
