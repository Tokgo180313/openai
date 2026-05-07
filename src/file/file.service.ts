import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { randomUUID } from 'crypto';
import { Binary, Collection, GridFSBucket, ObjectId } from 'mongodb';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, basename } from 'node:path';

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
