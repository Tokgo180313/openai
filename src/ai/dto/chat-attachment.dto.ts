import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export type ChatAttachmentType = 'image' | 'file';

export class ChatAttachmentDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(['image', 'file'])
  type: ChatAttachmentType;

  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;
}
