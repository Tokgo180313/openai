import { IsArray, IsOptional, IsString } from 'class-validator';

/** 发起图片生成：先合并更新 Mongo task_image，再调 OpenAI 兼容接口 */
export class TaskImageGenerateImageDto {
  @IsString()
  taskId: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  inputText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceImages?: string[];

  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @IsOptional()
  @IsString()
  imageSize?: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  /** 模型/渠道提供方，如 openai、google；写入 usages 时作为 provider */
  @IsOptional()
  @IsString()
  provider?: string;
}
