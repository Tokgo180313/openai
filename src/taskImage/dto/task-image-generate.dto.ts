import { IsArray, IsOptional, IsString } from 'class-validator';

/** 图片生成请求参数 */
export class TaskImageGenerateDto {
  @IsString()
  taskId: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  imageRatio?: string;

  @IsOptional()
  @IsString()
  imageSize?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  prompt?: string;

  /** 模型/渠道提供方，如 openai、google */
  @IsOptional()
  @IsString()
  provider?: string;
}
