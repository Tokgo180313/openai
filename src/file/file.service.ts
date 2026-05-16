import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { randomUUID } from 'crypto';
import { Binary, Collection, GridFSBucket, ObjectId } from 'mongodb';
import {
  mkdir,
  writeFile,
  access,
  unlink,
  realpath,
  stat,
  readFile,
} from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { basename, extname, join, resolve, sep } from 'node:path';

type UploadChunkFile = {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
};

type UploadChunkInput = {
  file: UploadChunkFile;
  uploadId?: string;
  documentId?: string;
  fileName: string;
  mimeType?: string;
};

type UploadSessionDoc = {
  uploadId: string;
  userId: string;
  documentId?: string;
  fileName: string;
  mimeType: string;
  totalChunks: number;
  status: 'uploading' | 'completed';
  gridFsFileId?: string;
  openaiFileId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};

type FileMappingDoc = {
  userId: string;
  title: string;
  url: string;
  createTime: Date;
  updateTime: Date;
};

@Injectable()
export class FileService implements OnModuleInit {
  private bucket: GridFSBucket;
  private uploadSessionCollection: Collection<UploadSessionDoc>;
  private uploadChunkCollection: Collection;
  private fileMappingCollection: Collection<FileMappingDoc>;
  private readonly localUploadRoot = join(process.cwd(), 'uploads');
  private readonly inputImagesRoot = join(process.cwd(), 'inputImages');
  private readonly resultImagesRoot = join(process.cwd(), 'resultImages');

  private static readonly INPUT_IMAGE_MIMES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ]);

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  public async onModuleInit() {
    const db = this.connection.db;
    if (!db) {
      throw new Error('mongodb connection is not initialized');
    }

    this.bucket = new GridFSBucket(db, {
      bucketName: 'uploaded_files',
    });
    this.uploadSessionCollection = db.collection<UploadSessionDoc>('upload_sessions');
    this.uploadChunkCollection = db.collection('upload_chunks');
    this.fileMappingCollection = db.collection<FileMappingDoc>('files');

    await this.uploadSessionCollection.createIndex({ uploadId: 1 }, { unique: true });
    await this.uploadChunkCollection.createIndex(
      { uploadId: 1, chunkIndex: 1 },
      { unique: true },
    );
    await this.uploadChunkCollection.createIndex({ uploadId: 1 });
    await this.fileMappingCollection.createIndex({ userId: 1, url: 1 }, { unique: true });
  }

  /** YYYY-MM-DD（按服务器本地日历），用于 inputImages/resultImages 下按日分子目录 */
  public getImageStorageDateFolder(d: Date = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** 上传图片到 inputImages/{userId}/{YYYY-MM-DD}/，返回绝对路径 */
  public async uploadInputImage(
    file: UploadChunkFile | undefined,
    userId: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    const mimeType = String(file.mimetype ?? '').trim().toLowerCase();
    if (!FileService.INPUT_IMAGE_MIMES.has(mimeType)) {
      throw new BadRequestException('only image files are allowed');
    }

    const ext =
      extname(this.sanitizeFileName(file.originalname ?? '')) ||
      this.extFromImageMime(mimeType);
    const safeName = `${randomUUID()}${ext || '.bin'}`;
    const dateFolder = this.getImageStorageDateFolder();
    const userDir = join(
      this.inputImagesRoot,
      this.sanitizePathSegment(userId),
      dateFolder,
    );
    await mkdir(userDir, { recursive: true });
    const localPath = join(userDir, safeName);
    await writeFile(localPath, file.buffer);

    return {
      localPath,
      fileName: safeName,
      mimeType,
    };
  }

  /**
   * 读取 inputImages 或 resultImages 任意子路径下的图片为 data URL（仅校验落在根目录下，不按登录用户限制）。
   */
  public async readInputImageAsDataUrl(
    localPath: string,
    _userId?: string,
  ): Promise<string> {
    const resolved = await this.resolveReadableImagePathUnderRoots(localPath);
    const buf = await readFile(resolved);
    const contentType = this.mimeTypeFromImagePath(resolved);
    if (!FileService.INPUT_IMAGE_MIMES.has(contentType)) {
      throw new BadRequestException('only image files are allowed');
    }
    return `data:${contentType};base64,${buf.toString('base64')}`;
  }

  /** 解析并校验 localPath 落在当前用户 inputImages 整棵子树下（含按日子目录），用于删除 */
  private async resolveInputImagePathForUser(
    localPath: string,
    userId: string,
  ): Promise<string> {
    const raw = String(localPath ?? '').trim();
    if (!raw) {
      throw new BadRequestException('localPath is required');
    }

    const userDir = join(this.inputImagesRoot, this.sanitizePathSegment(userId));
    let resolvedTarget = resolve(raw);
    try {
      resolvedTarget = await realpath(resolvedTarget);
    } catch {
      throw new NotFoundException('file not found');
    }

    let resolvedRoot: string;
    try {
      resolvedRoot = await realpath(userDir);
    } catch {
      throw new NotFoundException('file not found');
    }

    if (
      resolvedTarget !== resolvedRoot &&
      !resolvedTarget.startsWith(resolvedRoot + sep)
    ) {
      throw new ForbiddenException('invalid path');
    }

    return resolvedTarget;
  }

  /**
   * 解析并校验 localPath 落在 inputImages 或 resultImages 根目录之下（任意账号子目录均可，防路径穿越）。
   */
  private async resolveReadableImagePathUnderRoots(
    localPath: string,
  ): Promise<string> {
    const raw = String(localPath ?? '').trim();
    if (!raw) {
      throw new BadRequestException('localPath is required');
    }

    let resolvedTarget = resolve(raw);
    try {
      resolvedTarget = await realpath(resolvedTarget);
    } catch {
      throw new NotFoundException('file not found');
    }

    const roots = [this.inputImagesRoot, this.resultImagesRoot];
    for (const root of roots) {
      let resolvedRoot: string;
      try {
        resolvedRoot = await realpath(root);
      } catch {
        continue;
      }
      if (
        resolvedTarget === resolvedRoot ||
        resolvedTarget.startsWith(resolvedRoot + sep)
      ) {
        return resolvedTarget;
      }
    }

    throw new ForbiddenException('invalid path');
  }

  /** 根据本地路径读取 inputImages 或 resultImages 下的图片流（不按登录用户限制） */
  public async getInputImageFileByLocalPath(
    localPath: string,
    _userId?: string,
  ) {
    const resolvedTarget =
      await this.resolveReadableImagePathUnderRoots(localPath);

    let st;
    try {
      st = await stat(resolvedTarget);
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === 'ENOENT') {
        throw new NotFoundException('file not found');
      }
      throw e;
    }
    if (!st.isFile()) {
      throw new BadRequestException('not a file');
    }

    const contentType = this.mimeTypeFromImagePath(resolvedTarget);
    if (!FileService.INPUT_IMAGE_MIMES.has(contentType)) {
      throw new BadRequestException('only image files are allowed');
    }

    return {
      filename: basename(resolvedTarget),
      contentType,
      length: st.size,
      stream: createReadStream(resolvedTarget),
    };
  }

  /** 根据本地路径删除图片（仅限当前用户 inputImages 目录下） */
  public async deleteInputImageByLocalPath(localPath: string, userId: string) {
    const resolvedTarget = await this.resolveInputImagePathForUser(
      localPath,
      userId,
    );

    try {
      await unlink(resolvedTarget);
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === 'ENOENT') {
        throw new NotFoundException('file not found');
      }
      throw e;
    }

    return { ok: true, localPath: resolvedTarget };
  }

  private mimeTypeFromImagePath(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const map: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
    };
    return map[ext] ?? 'application/octet-stream';
  }

  private extFromImageMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/svg+xml': '.svg',
    };
    return map[mime] ?? '';
  }

  public async uploadFileChunk(input: UploadChunkInput, userId: string) {
    const { file, fileName } = input;
    const uploadId = String(input.uploadId ?? '').trim() || randomUUID();
    const documentId = String(input.documentId ?? '').trim();

    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    if (!fileName) {
      throw new BadRequestException('fileName is required');
    }

    const mimeType =
      String(input.mimeType ?? '').trim() ||
      file.mimetype ||
      'application/octet-stream';
    const now = new Date();

    // 直接单次落盘，不走分片重组。
    const safeDocumentId = this.sanitizePathSegment(documentId || userId);
    const safeFileName = this.sanitizeFileName(fileName);
    const titleFolder = join(this.localUploadRoot, safeDocumentId);
    await mkdir(titleFolder, { recursive: true });
    const localFilePath = join(titleFolder, safeFileName);
    await writeFile(localFilePath, file.buffer);

    // 写文件映射。
    await this.fileMappingCollection.updateOne(
      { userId, url: localFilePath },
      {
        $set: {
          title: safeFileName,
          updateTime: now,
        },
        $setOnInsert: {
          userId,
          url: localFilePath,
          createTime: now,
        },
      },
      { upsert: true },
    );

    // 直接把会话记为 completed，兼容 uploadStatus 查询。
    await this.uploadSessionCollection.updateOne(
      { uploadId },
      {
        $set: {
          userId,
          documentId,
          fileName: safeFileName,
          mimeType,
          totalChunks: 1,
          gridFsFileId: localFilePath,
          status: 'completed',
          completedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return {
      uploadId,
      fileName: safeFileName,
      mimeType,
      status: 'completed',
      complete: true,
      fileId: localFilePath,
      file_url: localFilePath,
    };
  }

  public async getUploadStatus(uploadId: string, userId: string) {
    const session = await this.uploadSessionCollection.findOne({ uploadId });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('upload session not found');
    }

    if (session.status === 'completed') {
      return {
        uploadId,
        status: 'completed',
        fileId: session.gridFsFileId,
        totalChunks: 1,
        receivedChunks: [0],
        missingChunks: [],
      };
    }

    const uploadedIndexes = await this.uploadChunkCollection
      .find({ uploadId }, { projection: { chunkIndex: 1, _id: 0 } })
      .sort({ chunkIndex: 1 })
      .toArray();
    const receivedChunks = uploadedIndexes.map((item: any) => item.chunkIndex as number);
    const receivedSet = new Set(receivedChunks);
    const missingChunks: number[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      if (!receivedSet.has(i)) {
        missingChunks.push(i);
      }
    }

    return {
      uploadId,
      status: session.status,
      fileId: session.gridFsFileId,
      totalChunks: session.totalChunks,
      receivedChunks,
      missingChunks,
    };
  }

  public async getDownloadFile(fileId: string, userId: string) {
    const targetFileId = String(fileId ?? '').trim();
    if (!targetFileId) {
      throw new BadRequestException('fileId is required');
    }

    const session = await this.uploadSessionCollection.findOne({
      gridFsFileId: targetFileId,
      userId,
      status: 'completed',
    });
    if (!session) {
      throw new NotFoundException('file not found');
    }

    const isObjectId = ObjectId.isValid(targetFileId);
    if (!isObjectId) {
      try {
        await access(targetFileId);
      } catch {
        throw new NotFoundException('file not found');
      }
      return {
        filename: basename(targetFileId) || session.fileName,
        contentType: session.mimeType || 'application/octet-stream',
        length: 0,
        stream: createReadStream(targetFileId),
      };
    }

    const objectId = new ObjectId(targetFileId);
    const fileDocs = await this.bucket.find({ _id: objectId }).toArray();
    const fileDoc = fileDocs[0];
    if (!fileDoc) {
      throw new NotFoundException('file not found');
    }
    return {
      filename: fileDoc.filename || session.fileName,
      contentType: fileDoc.contentType || session.mimeType || 'application/octet-stream',
      length: fileDoc.length ?? 0,
      stream: this.bucket.openDownloadStream(objectId),
    };
  }

  private sanitizePathSegment(input: string): string {
    const raw = String(input ?? '').trim();
    const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_');
    return cleaned || 'default';
  }

  private sanitizeFileName(input: string): string {
    const raw = String(input ?? '').trim();
    const base = basename(raw);
    const cleaned = base.replace(/[^\w.\-]/g, '_');
    return cleaned || `file_${Date.now()}`;
  }
}
