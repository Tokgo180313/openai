import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';

export class RecordDto {
  @Transform(({ value }) => positiveInt(value, 1))
  page: number;

  @Transform(({ value }) => positiveInt(value, 10))
  pageSize: number;

  /** 操作者账号，模糊匹配 */
  @IsOptional()
  @IsString()
  account?: string;

  /** 描述，模糊匹配 */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 按创建日期筛选（北京时间当日 0:00～23:59:59.999），格式 `YYYY-MM-DD`。
   * 若填写此项，则不再使用下面的 createdAtStart / createdAtEnd。
   */
  @IsOptional()
  @IsString()
  createdAt?: string;

  /** 创建时间起（含），可解析的日期字符串（与 createdAt 二选一） */
  @IsOptional()
  @IsString()
  createdAtStart?: string;

  /** 创建时间止（含），可解析的日期字符串 */
  @IsOptional()
  @IsString()
  createdAtEnd?: string;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }
  get limit(): number {
    return this.pageSize;
  }
}
