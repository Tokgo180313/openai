import { IsString } from 'class-validator';

/** 按 taskId + 当前用户 + status=1 查询历史（不分页） */
export class QueryTaskImageHistoryByTaskIdDto {
  @IsString()
  taskId: string;
}
