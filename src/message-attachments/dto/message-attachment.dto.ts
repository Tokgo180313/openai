import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MESSAGE_ATTACHMENT_ROLES } from '../enums/message-attachment-role.enum';
import { MESSAGE_ATTACHMENT_TYPES } from '../enums/message-attachment-type.enum';

export class MessageAttachmentItemDto {
  @IsNotEmpty()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MaxLength(24)
  messageId: string;

  @IsNotEmpty()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  fileId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([...MESSAGE_ATTACHMENT_TYPES])
  attachmentType: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([...MESSAGE_ATTACHMENT_ROLES])
  role: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class MessageAttachmentBatchCreateDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentItemDto)
  items: MessageAttachmentItemDto[];
}

export class MessageAttachmentUpdateDto {
  @IsNotEmpty()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class MessageAttachmentQueryByMessageDto {
  @IsNotEmpty()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MaxLength(24)
  messageId: string;
}
