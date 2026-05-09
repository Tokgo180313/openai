import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class QueryTaskImageHistoryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  current = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageSize = 10;

  @IsOptional()
  @IsString()
  task_id?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  status?: number;

  @IsOptional()
  @IsString()
  model_name?: string;

  get skip(): number {
    return (this.current - 1) * this.pageSize;
  }

  get limit(): number {
    return this.pageSize;
  }
}
