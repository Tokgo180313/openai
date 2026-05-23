import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { access, mkdir, writeFile, stat } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import { createReadStream } from 'node:fs';
import { positiveInt } from 'src/common/dto/pagination-int.util';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import {
  UploadFileQueryDto,
  UploadFileSaveOptionsDto,
  UploadFileUpdateDto,
} from './dto/upload-file.dto';
import { UploadFile } from './entities/upload-file.entity';
import type { UploadFileSource } from './enums/upload-file-source.enum';
import type { UploadFileStatus } from './enums/upload-file-status.enum';
import {
  inferFileType,
  normalizeExt,
  readImageDimensions,
  sha256Hex,
} from './utils/file-meta.util';

type MulterFile = {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
};

@Injectable()
export class UploadFileService {
  private readonly uploadRoot = join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(UploadFile)
    private readonly uploadFileRepo: Repository<UploadFile>,
    private readonly configService: ConfigService,
  ) {}

  async save(
    file: MulterFile | undefined,
    userId: string,
    options?: UploadFileSaveOptionsDto,
  ): Promise<{ fileId: number; url: string | null; record: UploadFile }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }

    const mimeType = String(file.mimetype ?? 'application/octet-stream').trim();
    const originalName = this.sanitizeFileName(
      file.originalname ?? `file_${Date.now()}`,
    );
    const ext = normalizeExt(originalName, mimeType);
    const storageName = `${randomUUID()}.${ext}`;
    const dateFolder = this.dateFolder();
    const userDir = join(
      this.uploadRoot,
      this.sanitizePathSegment(userId),
      dateFolder,
    );
    await mkdir(userDir, { recursive: true });
    const storagePath = join(userDir, storageName);
    await writeFile(storagePath, file.buffer);

    const dims =
      inferFileType(mimeType) === 'image'
        ? readImageDimensions(file.buffer, mimeType)
        : null;

    const entity = this.uploadFileRepo.create({
      userId,
      source: (options?.source as UploadFileSource) ?? 'user_upload',
      fileType: inferFileType(mimeType),
      mimeType,
      originalName,
      storageName,
      storagePath,
      url: null,
      size: file.buffer.length,
      ext,
      hash: sha256Hex(file.buffer),
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      duration: null,
      status: 'temp',
      metadata: options?.metadata ?? null,
    });

    const saved = await this.uploadFileRepo.save(entity);
    saved.url = this.buildPublicUrl(saved.id);
    await this.uploadFileRepo.update(saved.id, { url: saved.url });

    return {
      fileId: saved.id,
      url: saved.url,
      record: { ...saved, url: saved.url },
    };
  }

  async update(
    dto: UploadFileUpdateDto,
    userId: string,
  ): Promise<UploadFile> {
    const id = this.parseId(dto.id);
    const row = await this.findOwnedOrThrow(id, userId);

    if (dto.status !== undefined) {
      row.status = dto.status as UploadFileStatus;
      if (row.status === 'deleted' && !row.deletedAt) {
        row.deletedAt = new Date();
      }
      if (row.status !== 'deleted') {
        row.deletedAt = null;
      }
    }
    if (dto.source !== undefined) {
      row.source = dto.source as UploadFileSource;
    }
    if (dto.fileType !== undefined) {
      row.fileType = dto.fileType as UploadFile['fileType'];
    }
    if (dto.metadata !== undefined) {
      row.metadata = dto.metadata;
    }
    if (dto.duration !== undefined) {
      row.duration = dto.duration;
    }

    return await this.uploadFileRepo.save(row);
  }

  async findById(id: number, userId: string): Promise<UploadFile> {
    return await this.findOwnedOrThrow(id, userId);
  }

  async findList(
    dto: UploadFileQueryDto,
    userId: string,
  ): Promise<PaginationResponse<UploadFile>> {
    const currentPage = positiveInt(dto.currentPage, 1);
    const pageSize = positiveInt(dto.pageSize, 10);
    const qb = this.uploadFileRepo
      .createQueryBuilder('f')
      .where('f.user_id = :userId', { userId })
      .andWhere('f.status != :deleted', { deleted: 'deleted' });

    if (dto.status) {
      qb.andWhere('f.status = :status', { status: dto.status });
    }
    if (dto.fileType) {
      qb.andWhere('f.file_type = :fileType', { fileType: dto.fileType });
    }
    if (dto.source) {
      qb.andWhere('f.source = :source', { source: dto.source });
    }
    if (dto.keyword?.trim()) {
      const kw = `%${dto.keyword.trim()}%`;
      qb.andWhere(
        '(f.original_name LIKE :kw OR f.storage_name LIKE :kw)',
        { kw },
      );
    }

    qb.orderBy('f.id', 'DESC');
    const total = await qb.getCount();
    const list = await qb
      .skip((currentPage - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      list,
      total,
      currentPage,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async deleteById(id: number, userId: string): Promise<void> {
    const row = await this.findOwnedOrThrow(id, userId);
    row.status = 'deleted';
    row.deletedAt = new Date();
    await this.uploadFileRepo.save(row);
  }

  async getDownloadStream(id: number, userId: string) {
    const row = await this.findOwnedOrThrow(id, userId);
    if (row.status === 'deleted') {
      throw new NotFoundException('file not found');
    }

    const resolved = await this.resolveStoragePath(row.storagePath, userId);
    let length = Number(row.size) || 0;
    try {
      const st = await stat(resolved);
      if (st.isFile()) length = st.size;
    } catch {
      throw new NotFoundException('file not found on disk');
    }

    return {
      filename: row.originalName || row.storageName,
      contentType: row.mimeType || 'application/octet-stream',
      length,
      stream: createReadStream(resolved),
    };
  }

  /** 将暂存文件标记为已使用（供业务在发送消息等场景调用） */
  async markUsed(id: number, userId: string): Promise<UploadFile> {
    return await this.update({ id: String(id), status: 'used' }, userId);
  }

  private async findOwnedOrThrow(
    id: number,
    userId: string,
  ): Promise<UploadFile> {
    const row = await this.uploadFileRepo.findOne({ where: { id } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('upload file not found');
    }
    return row;
  }

  private parseId(raw: string): number {
    const id = parsePositiveIntId(raw);
    if (!id) {
      throw new BadRequestException('invalid file id');
    }
    return id;
  }

  private buildPublicUrl(fileId: number): string | null {
    const base = String(
      this.configService.get<string>('APP_PUBLIC_URL') ??
        process.env['APP_PUBLIC_URL'] ??
        '',
    ).trim();
    if (!base) return null;
    const root = base.replace(/\/$/, '');
    return `${root}/upload-file/${fileId}/download`;
  }

  private async resolveStoragePath(
    storagePath: string,
    userId: string,
  ): Promise<string> {
    const raw = String(storagePath ?? '').trim();
    if (!raw) {
      throw new BadRequestException('invalid storage path');
    }

    const resolvedTarget = resolve(raw);
    const resolvedRoot = resolve(this.uploadRoot);
    const prefix = resolvedRoot.endsWith(sep)
      ? resolvedRoot
      : resolvedRoot + sep;

    if (
      resolvedTarget !== resolvedRoot &&
      !resolvedTarget.startsWith(prefix)
    ) {
      throw new ForbiddenException('storage path not allowed');
    }

    const userSegment = this.sanitizePathSegment(userId);
    const userPrefix = join(resolvedRoot, userSegment) + sep;
    if (
      resolvedTarget !== join(resolvedRoot, userSegment) &&
      !resolvedTarget.startsWith(userPrefix)
    ) {
      throw new ForbiddenException('file does not belong to current user');
    }

    try {
      await access(resolvedTarget);
    } catch {
      throw new NotFoundException('file not found');
    }

    return resolvedTarget;
  }

  private dateFolder(d: Date = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private sanitizePathSegment(input: string): string {
    const raw = String(input ?? '').trim();
    const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_');
    return cleaned || 'default';
  }

  private sanitizeFileName(input: string): string {
    const raw = String(input ?? '').trim();
    const base = basename(raw);
    const cleaned = base.replace(/[^\w.\-()\u4e00-\u9fff]/g, '_');
    return cleaned || `file_${Date.now()}`;
  }
}
