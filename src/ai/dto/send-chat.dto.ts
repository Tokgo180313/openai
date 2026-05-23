import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ChatAttachmentDto } from './chat-attachment.dto';

export class SendChatDto {
  @IsOptional()
  @IsString()
  titleId?: string;

  @IsNotEmpty()
  @IsString()
  modelCode: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatAttachmentDto)
  attachments?: ChatAttachmentDto[];

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  /** 临时对话 ID（无 titleId 时作为 documentId） */
  @IsOptional()
  @IsString()
  clientMessageId?: string;
}
