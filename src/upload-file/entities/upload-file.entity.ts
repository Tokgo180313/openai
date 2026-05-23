import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { UploadFileSource } from '../enums/upload-file-source.enum';
import type { UploadFileStatus } from '../enums/upload-file-status.enum';
import type { UploadFileType } from '../enums/upload-file-type.enum';

/** 上传/生成文件元数据表：用户上传、AI 生成、系统生成等文件的元信息 */
@Entity('upload_file', { comment: '上传/生成文件元数据表' })
@Index('idx_upload_file_user_status', ['userId', 'status'])
@Index('idx_upload_file_hash', ['hash'])
export class UploadFile {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '文件 ID，主键' })
  id: number;

  @Column({
    name: 'user_id',
    type: 'varchar',
    length: 36,
    comment: '上传者或文件归属用户 ID',
  })
  userId: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: 'user_upload',
    comment:
      '文件来源：user_upload 用户上传、ai_generated AI 生成、system_generated 系统生成',
  })
  source: UploadFileSource;

  @Column({
    name: 'file_type',
    type: 'varchar',
    length: 16,
    comment: '文件大类：image 图片、file 文档/通用文件、audio 音频、video 视频',
  })
  fileType: UploadFileType;

  @Column({
    name: 'mime_type',
    type: 'varchar',
    length: 128,
    comment: '文件 MIME 类型，如 image/png、application/pdf',
  })
  mimeType: string;

  @Column({
    name: 'original_name',
    type: 'varchar',
    length: 512,
    comment: '上传前的原始文件名',
  })
  originalName: string;

  @Column({
    name: 'storage_name',
    type: 'varchar',
    length: 512,
    comment: '服务器本地存储用的文件名',
  })
  storageName: string;

  @Column({
    name: 'storage_path',
    type: 'varchar',
    length: 1024,
    comment:
      '文件在服务器上的物理存储路径（如 uploads 目录下相对/绝对路径）',
  })
  storagePath: string;

  @Column({
    type: 'varchar',
    length: 1024,
    nullable: true,
    comment: '前端可访问该文件的 URL',
  })
  url: string | null;

  @Column({ type: 'bigint', default: 0, comment: '文件大小，单位：字节' })
  size: number;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: '文件扩展名，如 png、pdf、txt',
  })
  ext: string | null;

  @Column({
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '文件哈希值，用于去重',
  })
  hash: string | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '图片宽度；非图片文件可为空',
  })
  width: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '图片高度；非图片文件可为空',
  })
  height: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '音频/视频时长（秒）；其它类型可为空',
  })
  duration: number | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'temp',
    comment: '文件状态：temp 暂存、used 使用中、deleted 已删除',
  })
  status: UploadFileStatus;

  @Column({
    type: 'json',
    nullable: true,
    comment: '扩展信息/元数据（JSON）',
  })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    nullable: true,
    comment: '软删除时间，可选',
  })
  deletedAt: Date | null;
}
