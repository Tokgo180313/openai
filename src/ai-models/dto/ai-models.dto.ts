import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';

export class AiModelCreateDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  provider: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  modelCode: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  apiModelName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  modelType: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  baseUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return positiveInt(value, 100);
  })
  @IsInt()
  @Min(0)
  sort?: number;
}

export class AiModelQueryDto {
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
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  modelCode?: string;

  @IsOptional()
  @IsString()
  modelType?: string;

  /** 1 启用 / 0 禁用 */
  @IsOptional()
  @IsString()
  @MaxLength(1)
  enabled?: string;
}

export class AiModelUpdateDto {
  @IsNotEmpty({ message: 'id 不能为空' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  modelCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  apiModelName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  modelType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  baseUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return positiveInt(value, 100);
  })
  @IsInt()
  @Min(0)
  sort?: number;

  /** 1 启用 / 0 禁用 */
  @IsOptional()
  @IsString()
  @MaxLength(1)
  enabled?: string;
}
