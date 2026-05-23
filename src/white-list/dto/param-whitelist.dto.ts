import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';
import {
  ARRAY_ITEM_PARAM_TYPES,
  PARAM_TYPES,
} from '../entities/ai-model-param-whitelist.entity';

export class ParamWhitelistCreateDto {
  @IsNotEmpty()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  modelId: string;

  /** 根参数不传；嵌套参数传父节点 id */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return null;
    return String(value).trim();
  })
  @IsString()
  parentId?: string | null;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  paramKey: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  apiParamKey: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([...PARAM_TYPES])
  paramType: string;

  /** paramType=array 时必填，表示数组元素类型 */
  @ValidateIf((o: ParamWhitelistCreateDto) => o.paramType === 'array')
  @IsNotEmpty()
  @IsString()
  @IsIn([...ARRAY_ITEM_PARAM_TYPES])
  itemParamType?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 0;
    return value === '1' || value === 1 || value === true ? 1 : 0;
  })
  @IsInt()
  required?: number;

  @IsOptional()
  defaultValue?: unknown;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
  })
  @IsString()
  minValue?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
  })
  @IsString()
  maxValue?: string;

  @ValidateIf((o: ParamWhitelistCreateDto) =>
    ['enum', 'array'].includes(o.paramType) ||
    (o.paramType === 'array' && o.itemParamType === 'enum'),
  )
  @IsOptional()
  @IsArray()
  enumValues?: unknown[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 1;
    return value === '0' || value === 0 || value === false ? 0 : 1;
  })
  @IsInt()
  enabled?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 0;
    return positiveInt(value, 0);
  })
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  remark?: string;
}

export class ParamWhitelistQueryDto {
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
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  modelId?: string;

  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  paramKey?: string;

  @IsOptional()
  @IsString()
  paramPath?: string;

  @IsOptional()
  @IsString()
  @IsIn([...PARAM_TYPES])
  paramType?: string;

  /** 1 启用 / 0 禁用 */
  @IsOptional()
  @IsString()
  @MaxLength(1)
  enabled?: string;
}

export class ParamWhitelistUpdateDto {
  @IsNotEmpty({ message: 'id 不能为空' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  id: string;

  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  modelId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return String(value).trim();
  })
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  paramKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  apiParamKey?: string;

  @IsOptional()
  @IsString()
  @IsIn([...PARAM_TYPES])
  paramType?: string;

  @IsOptional()
  @IsString()
  @IsIn([...ARRAY_ITEM_PARAM_TYPES])
  itemParamType?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === '1' || value === 1 || value === true ? 1 : 0;
  })
  @IsInt()
  required?: number;

  @IsOptional()
  defaultValue?: unknown;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (value === '') return null;
    return String(value);
  })
  @ValidateIf((_, v) => v !== null)
  @IsString()
  minValue?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (value === '') return null;
    return String(value);
  })
  @ValidateIf((_, v) => v !== null)
  @IsString()
  maxValue?: string | null;

  @IsOptional()
  @IsArray()
  enumValues?: unknown[] | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === '0' || value === 0 || value === false ? 0 : 1;
  })
  @IsInt()
  enabled?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return positiveInt(value, 0);
  })
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return String(value);
  })
  @IsString()
  @MaxLength(512)
  remark?: string | null;
}
