import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class AiRequestDto {
  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  apiModelName: string;

  @IsNotEmpty()
  @IsString()
  modelType: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  /** 业务载荷：messages / prompt / files 等，由 handler 解释 */
  @IsObject()
  payload: Record<string, unknown>;
}
