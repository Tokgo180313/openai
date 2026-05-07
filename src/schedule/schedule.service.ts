import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import {
  ScheduleTask,
  ScheduleTaskDocument,
} from 'src/schemas/schedule/schedule.schema';
import {
  ScheduleCreateDto,
  ScheduleQueryDto,
  ScheduleUpdateDto,
} from './dto/schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(ScheduleTask.name)
    private readonly scheduleSchema: Model<ScheduleTaskDocument>,
  ) {}

  async createSchedule(dto: ScheduleCreateDto): Promise<ScheduleTask> {
    if (!dto?.name || !dto?.conExpression) {
      throw new BadRequestException('name and conExpression are required');
    }
    const created = new this.scheduleSchema({
      name: dto.name,
      conExpression: dto.conExpression,
      isEnabled: dto.isEnabled ?? true,
      status: dto.status ?? 'idle',
      lastRunAt: dto.lastRunAt,
      nextRunAt: dto.nextRunAt,
      lastError: dto.lastError,
    });
    return await created.save();
  }

  async findScheduleList(
    dto: ScheduleQueryDto,
  ): Promise<PaginationResponse<ScheduleTask>> {
    const { skip, limit } = dto;
    const query: FilterQuery<ScheduleTask> = {};
    if (dto?.name) {
      query.name = { $regex: dto.name, $options: 'i' };
    }
    if (typeof dto?.isEnabled === 'boolean') {
      query.isEnabled = dto.isEnabled;
    }
    if (dto?.status) {
      query.status = dto.status;
    }

    const total = await this.scheduleSchema.countDocuments(query).exec();
    const list = await this.scheduleSchema
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      list,
      total,
      currentPage: dto.page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findScheduleById(id: string): Promise<ScheduleTask> {
    const schedule = await this.scheduleSchema.findById(id).exec();
    if (!schedule) {
      throw new NotFoundException('schedule task not found');
    }
    return schedule;
  }

  async deleteScheduleById(id: string): Promise<void> {
    const existed = await this.scheduleSchema.findById(id).lean().exec();
    if (!existed) {
      throw new NotFoundException('schedule task not found');
    }
    await this.scheduleSchema.findByIdAndDelete(id).exec();
  }

  async updateScheduleById(
    id: string,
    dto: ScheduleUpdateDto,
  ): Promise<ScheduleTask> {
    const update: Partial<ScheduleTask> = {};

    if (typeof dto?.name === 'string') update.name = dto.name;
    if (typeof dto?.conExpression === 'string') {
      update.conExpression = dto.conExpression;
    }
    if (typeof dto?.isEnabled === 'boolean') update.isEnabled = dto.isEnabled;
    if (typeof dto?.status === 'string') update.status = dto.status;
    if (dto?.lastRunAt !== undefined) update.lastRunAt = dto.lastRunAt;
    if (dto?.nextRunAt !== undefined) update.nextRunAt = dto.nextRunAt;
    if (dto?.lastError !== undefined) update.lastError = dto.lastError;

    if (Object.keys(update).length === 0) {
      throw new BadRequestException('no fields to update');
    }

    const updated = await this.scheduleSchema
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('schedule task not found');
    }
    return updated;
  }
}
