import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateModelDto {
  @IsNotEmpty({ message: 'id 不能为空' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  status?: string;

  @IsOptional()
  @IsString()
  modelType?: string;
}
