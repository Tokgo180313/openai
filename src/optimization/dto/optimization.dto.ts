import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';

export class CreateCopyOptimizationDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  /** 1 启用 0 停用，默认启用 */
  @IsOptional()
  @IsIn(['0', '1'])
  status?: string;
}

export class CopyOptimizationQueryDto {
  @Transform(({ value }) => positiveInt(value, 1))
  page: number;

  @Transform(({ value }) => positiveInt(value, 10))
  pageSize: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsIn(['0', '1', ''])
  status?: string;

  /** 文案内容，模糊匹配 */
  @IsOptional()
  @IsString()
  content?: string;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  get limit(): number {
    return this.pageSize;
  }
}
