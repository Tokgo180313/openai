import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OperationLogService } from 'src/common/operation-log/operation-log.service';
import { ScheduleService } from './schedule.service';
import {
  ScheduleCreateDto,
  ScheduleQueryDto,
  ScheduleUpdateDto,
} from './dto/schedule.dto';

@ApiTags('schedule')
@Controller('/schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly operationLog: OperationLogService,
  ) {}

  @Put('/add')
  async addSchedule(
    @Body() dto: ScheduleCreateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.scheduleService.createSchedule(dto);
    await this.operationLog.append(operatorId, '定时任务添加', String(row.id));
    return row;
  }

  @Post('/findScheduleList')
  async findScheduleList(@Body() dto: ScheduleQueryDto) {
    return await this.scheduleService.findScheduleList(dto);
  }

  @Get('/findById')
  async findById(@Query('id') id: string) {
    return await this.scheduleService.findScheduleById(id);
  }

  @Delete('/deleteById')
  async deleteById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.scheduleService.deleteScheduleById(id);
    await this.operationLog.append(operatorId, '定时任务删除', id);
  }

  @Put('/updateById')
  async updateById(
    @Query('id') id: string,
    @Body() dto: ScheduleUpdateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.scheduleService.updateScheduleById(id, dto);
    await this.operationLog.append(operatorId, '定时任务修改', id);
    return row;
  }
}
