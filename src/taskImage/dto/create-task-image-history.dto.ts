import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

/** 新增生成图片历史（user_id 由登录态注入，不需传） */
export class CreateTaskImageHistoryDto {
  @IsString()
  task_id: string;

  @IsString()
  model_name: string;

  @IsString()
  input_text: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  source_images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  result_images?: string[];

  @IsOptional()
  @IsString()
  cover_image?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  image_count?: number;

  @IsOptional()
  @IsString()
  aspect_ratio?: string;

  @IsOptional()
  @IsString()
  image_size?: string;

  @IsInt()
  @Type(() => Number)
  status: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cost?: number;
}
