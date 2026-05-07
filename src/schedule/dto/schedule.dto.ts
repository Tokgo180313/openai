import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { positiveInt } from 'src/common/dto/pagination-int.util';

export class ScheduleCreateDto {
  name: string;
  conExpression: string;
  isEnabled?: boolean;
  status?: string;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastError?: string;
}

export class ScheduleQueryDto {
  @Transform(({ value }) => positiveInt(value, 1))
  page: number;

  @Transform(({ value }) => positiveInt(value, 10))
  pageSize: number;

  @IsOptional()
  name?: string;

  @IsOptional()
  isEnabled?: boolean;

  @IsOptional()
  status?: string;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  get limit(): number {
    return this.pageSize;
  }
}

export class ScheduleUpdateDto {
  name?: string;
  conExpression?: string;
  isEnabled?: boolean;
  status?: string;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastError?: string;
}
