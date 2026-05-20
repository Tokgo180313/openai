import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OperationLogService } from 'src/common/operation-log/operation-log.service';
import {
  CopyOptimizationQueryDto,
  CreateCopyOptimizationDto,
} from './dto/optimization.dto';
import { OptimizationService } from './optimization.service';

@ApiTags('optimization')
@Controller('/optimization')
@UseGuards(JwtAuthGuard)
export class OptimizationController {
  constructor(
    private readonly optimizationService: OptimizationService,
    private readonly operationLog: OperationLogService,
  ) {}

  @Put('/add')
  async add(
    @Body() dto: CreateCopyOptimizationDto,
    @CurrentUser('id') userId: string,
  ) {
    const row = await this.optimizationService.create(userId, dto);
    await this.operationLog.append(
      userId,
      '文案优化添加',
      String(row.id),
    );
    return row;
  }

  @Post('/findList')
  async findList(
    @Body() dto: CopyOptimizationQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.optimizationService.findList(userId, dto);
  }
}
