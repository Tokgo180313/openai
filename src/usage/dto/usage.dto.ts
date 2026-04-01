import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';

export class UsageDto {
  @Transform(({ value }) => positiveInt(value, 1))
  page: number;

  @Transform(({ value }) => positiveInt(value, 10))
  pageSize: number;

  @IsOptional()
  account?: string;
  @IsOptional()
  modelName?: string;
  @IsOptional()
  modelClassify?: string;
  @IsOptional()
  startTime?: Date;
  @IsOptional()
  endTime?: Date;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }
  get limit(): number {
    return this.pageSize;
  }
}
