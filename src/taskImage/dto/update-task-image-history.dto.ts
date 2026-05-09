import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateTaskImageHistoryDto {
  @IsOptional()
  @IsString()
  task_id?: string;

  @IsOptional()
  @IsString()
  model_name?: string;

  @IsOptional()
  @IsString()
  input_text?: string;

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

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  status?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cost?: number;
}
