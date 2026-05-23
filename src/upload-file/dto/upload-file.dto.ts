import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';
import { UPLOAD_FILE_SOURCES } from '../enums/upload-file-source.enum';
import { UPLOAD_FILE_STATUSES } from '../enums/upload-file-status.enum';
import { UPLOAD_FILE_TYPES } from '../enums/upload-file-type.enum';

export class UploadFileQueryDto {
  @IsOptional()
  @Transform(({ value }) => positiveInt(value, 1))
  @IsInt()
  @Min(1)
  currentPage?: number = 1;

  @IsOptional()
  @Transform(({ value }) => positiveInt(value, 10))
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  @IsIn([...UPLOAD_FILE_STATUSES])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn([...UPLOAD_FILE_TYPES])
  fileType?: string;

  @IsOptional()
  @IsString()
  @IsIn([...UPLOAD_FILE_SOURCES])
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  keyword?: string;
}

export class UploadFileUpdateDto {
  @IsNotEmpty()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  @IsIn([...UPLOAD_FILE_STATUSES])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn([...UPLOAD_FILE_SOURCES])
  source?: string;

  @IsOptional()
  @IsString()
  @IsIn([...UPLOAD_FILE_TYPES])
  fileType?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;
}

export class UploadFileSaveOptionsDto {
  @IsOptional()
  @IsString()
  @IsIn([...UPLOAD_FILE_SOURCES])
  source?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
