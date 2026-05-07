import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import {
  ScheduleCreateDto,
  ScheduleQueryDto,
  ScheduleUpdateDto,
} from './dto/schedule.dto';

@ApiTags('schedule')
@Controller('/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Put('/add')
  async addSchedule(@Body() dto: ScheduleCreateDto) {
    return await this.scheduleService.createSchedule(dto);
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
  async deleteById(@Query('id') id: string) {
    return await this.scheduleService.deleteScheduleById(id);
  }

  @Put('/updateById')
  async updateById(@Query('id') id: string, @Body() dto: ScheduleUpdateDto) {
    return await this.scheduleService.updateScheduleById(id, dto);
  }
}
