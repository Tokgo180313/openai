import { IsArray, IsString } from 'class-validator';

/** 按 userId（登录态）+ taskId 更新 Mongo task_image 的 sourceImages */
export class TaskImageUpdateSourceImagesDto {
  @IsString()
  taskId: string;

  @IsArray()
  @IsString({ each: true })
  sourceImages: string[];
}
