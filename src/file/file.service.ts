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

type UploadChunkFile = {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
};

type UploadChunkInput = {
  file: UploadChunkFile;
  uploadId?: string;
  fileName: string;
  mimeType?: string;
  totalChunks: number;
  chunkIndex: number;
};

type UploadSessionDoc = {
  uploadId: string;
  userId: string;
  fileName: string;
  mimeType: string;
  totalChunks: number;
  status: 'uploading' | 'completed';
  gridFsFileId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};

@Injectable()
export class FileService implements OnModuleInit {
  private bucket: GridFSBucket;
  private uploadSessionCollection: Collection<UploadSessionDoc>;
  private uploadChunkCollection: Collection;

  constructor(@InjectConnection() private readonly connection: Connection) {}

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

    await this.uploadSessionCollection.createIndex({ uploadId: 1 }, { unique: true });
    await this.uploadChunkCollection.createIndex(
      { uploadId: 1, chunkIndex: 1 },
      { unique: true },
    );
    await this.uploadChunkCollection.createIndex({ uploadId: 1 });
  }

  public async uploadFileChunk(input: UploadChunkInput, userId: string) {
    const { file, fileName } = input;
    const totalChunks = Number(input.totalChunks);
    const chunkIndex = Number(input.chunkIndex);
    const uploadId = String(input.uploadId ?? '').trim() || randomUUID();

    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    if (!fileName) {
      throw new BadRequestException('fileName is required');
    }
    if (!Number.isInteger(totalChunks) || totalChunks <= 0) {
      throw new BadRequestException('totalChunks must be a positive integer');
    }
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= totalChunks) {
      throw new BadRequestException('chunkIndex is out of range');
    }

    const now = new Date();
    const mimeType =
      String(input.mimeType ?? '').trim() ||
      file.mimetype ||
      'application/octet-stream';

    await this.uploadSessionCollection.updateOne(
      { uploadId },
      {
        $setOnInsert: {
          uploadId,
          userId,
          fileName,
          mimeType,
          totalChunks,
          status: 'uploading',
          createdAt: now,
        },
        $set: { updatedAt: now },
      },
      { upsert: true },
    );

    const session = await this.uploadSessionCollection.findOne({ uploadId });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('upload session not found');
    }
    if (session.status === 'completed') {
      return {
        uploadId,
        complete: true,
        fileId: session.gridFsFileId,
      };
    }
    if (session.totalChunks !== totalChunks) {
      throw new BadRequestException('totalChunks mismatch with existing upload session');
    }

    try {
      await this.uploadChunkCollection.insertOne({
        uploadId,
        chunkIndex,
        data: file.buffer,
        size: file.buffer.length,
        createdAt: now,
      });
    } catch {
      // 分片已存在时直接返回当前状态，方便客户端重试时幂等。
    }

    const uploadedIndexes = await this.uploadChunkCollection
      .find({ uploadId }, { projection: { chunkIndex: 1, _id: 0 } })
      .sort({ chunkIndex: 1 })
      .toArray();
    const receivedChunks = uploadedIndexes.map((item: any) => item.chunkIndex as number);

    if (receivedChunks.length < totalChunks) {
      return {
        uploadId,
        complete: false,
        totalChunks,
        receivedChunks,
      };
    }

    const sortedChunks = await this.uploadChunkCollection
      .find({ uploadId })
      .sort({ chunkIndex: 1 })
      .toArray();

    const uploadStream = this.bucket.openUploadStream(fileName, {
      contentType: mimeType,
      metadata: { uploadId, userId, totalChunks },
    });
    for (const chunk of sortedChunks) {
      const data = chunk.data;
      const chunkBuffer = data instanceof Binary ? Buffer.from(data.buffer) : data;
      uploadStream.write(chunkBuffer);
    }
    await new Promise<void>((resolve, reject) => {
      uploadStream.end((error) => (error ? reject(error) : resolve()));
    });

    const fileId = uploadStream.id.toString();
    await this.uploadChunkCollection.deleteMany({ uploadId });
    await this.uploadSessionCollection.updateOne(
      { uploadId },
      {
        $set: {
          status: 'completed',
          gridFsFileId: fileId,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    return {
      uploadId,
      complete: true,
      fileId,
      totalChunks,
      receivedChunks,
    };
  }

  public async getUploadStatus(uploadId: string, userId: string) {
    const session = await this.uploadSessionCollection.findOne({ uploadId });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('upload session not found');
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
    if (!ObjectId.isValid(targetFileId)) {
      throw new BadRequestException('fileId is invalid');
    }

    const session = await this.uploadSessionCollection.findOne({
      gridFsFileId: targetFileId,
      userId,
      status: 'completed',
    });
    if (!session) {
      throw new NotFoundException('file not found');
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
}
