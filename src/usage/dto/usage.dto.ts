import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';

const trimOptionalString = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s === '' ? undefined : s;
};

export class UsageDto {
  @Transform(({ value }) => positiveInt(value, 1))
  page: number;

  @Transform(({ value }) => positiveInt(value, 10))
  pageSize: number;

  @IsOptional()
  @IsString()
  @Transform(trimOptionalString)
  account?: string;

  /** 模型名称，模糊匹配 */
  @IsOptional()
  @IsString()
  @Transform(trimOptionalString)
  modelName?: string;

  /** 服务商，精确匹配（不区分大小写） */
  @IsOptional()
  @IsString()
  @Transform(trimOptionalString)
  provider?: string;

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
