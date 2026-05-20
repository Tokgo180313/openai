import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';

/** 对应 Mongo `FieldMappings` 子文档：参数字段名映射 */
export class FieldMappingsDto {
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  imageList?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  imageSize?: string;

  @IsOptional()
  @IsString()
  ImageRatio?: string;

  @IsOptional()
  @IsString()
  imageNum?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  outputNum?: string;

  @IsOptional()
  @IsString()
  resolution?: string;
}

export class AiModelConfigCreateDto {
  @IsString()
  provider: string;

  @IsString()
  modelName: string;

  @IsString()
  displayName: string;

  @IsString()
  modelType: string;

  @IsString()
  apiUrl: string;

  @IsOptional()
  @IsNumber()
  maxImageCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedAspectRatio?: string[];

  @IsOptional()
  @IsString()
  defaultAspectRatio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedResolutions?: string[];

  @IsOptional()
  @IsString()
  defaultResolution?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedFormats?: string[];

  @IsOptional()
  @IsString()
  maxResolution?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FieldMappingsDto)
  fieldMappings?: FieldMappingsDto;

  @IsOptional()
  @IsObject()
  defaultParams?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  /** 是否兼容 OpenAI */
  @IsOptional()
  @IsBoolean()
  compatibleWithOpenAi?: boolean;

  @IsOptional()
  @IsNumber()
  sort?: number;
}

export class AiModelConfigQueryDto {
  @Transform(({ value }) => positiveInt(value, 1))
  page: number;

  @Transform(({ value }) => positiveInt(value, 10))
  pageSize: number;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  modelType?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isEnabled?: boolean;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  get limit(): number {
    return this.pageSize;
  }
}

export class AiModelConfigUpdateDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  modelType?: string;

  @IsOptional()
  @IsString()
  apiUrl?: string;

  @IsOptional()
  @IsNumber()
  maxImageCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedAspectRatio?: string[];

  @IsOptional()
  @IsString()
  defaultAspectRatio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedResolutions?: string[];

  @IsOptional()
  @IsString()
  defaultResolution?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedFormats?: string[];

  @IsOptional()
  @IsString()
  maxResolution?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FieldMappingsDto)
  fieldMappings?: FieldMappingsDto;

  @IsOptional()
  @IsObject()
  defaultParams?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  /** 是否兼容 OpenAI */
  @IsOptional()
  @IsBoolean()
  compatibleWithOpenAi?: boolean;

  @IsOptional()
  @IsNumber()
  sort?: number;
}
