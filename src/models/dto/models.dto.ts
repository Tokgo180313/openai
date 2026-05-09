import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';

export class ModelsDto {
  /**
   * 与 pageSize 都不传时表示不分页（查全部）。
   * 只传其一则另一项默认：page 默认 1，pageSize 默认 10。
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return positiveInt(value, 1);
  })
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return positiveInt(value, 10);
  })
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  modelName?: string;

  @IsOptional()
  modelClassify?: string;
  @IsOptional()
  status?: string;
}
