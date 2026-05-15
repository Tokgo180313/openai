import { IsString } from 'class-validator';

export class DeleteInputImageDto {
  /** 上传接口返回的本地绝对路径 */
  @IsString()
  localPath: string;
}
