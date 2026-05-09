import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { ScheduleTaskRecord } from './entities/schedule-task.entity';
import {
  ScheduleCreateDto,
  ScheduleQueryDto,
  ScheduleUpdateDto,
} from './dto/schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleTaskRecord)
    private readonly scheduleRepo: Repository<ScheduleTaskRecord>,
  ) {}

  async createSchedule(dto: ScheduleCreateDto): Promise<ScheduleTaskRecord> {
    if (!dto?.name || !dto?.conExpression) {
      throw new BadRequestException('name and conExpression are required');
    }
    const created = this.scheduleRepo.create({
      name: dto.name,
      conExpression: dto.conExpression,
      isEnabled: dto.isEnabled ?? true,
      status: dto.status ?? 'idle',
      lastRunAt: dto.lastRunAt ?? null,
      nextRunAt: dto.nextRunAt ?? null,
      lastError: dto.lastError ?? null,
    });
    return await this.scheduleRepo.save(created);
  }

  async findScheduleList(
    dto: ScheduleQueryDto,
  ): Promise<PaginationResponse<ScheduleTaskRecord>> {
    const { skip, limit } = dto;
    const qb = this.scheduleRepo.createQueryBuilder('s');

    if (dto?.name) {
      qb.andWhere('LOWER(s.name) LIKE LOWER(:name)', {
        name: `%${dto.name}%`,
      });
    }
    if (typeof dto?.isEnabled === 'boolean') {
      qb.andWhere('s.isEnabled = :en', { en: dto.isEnabled });
    }
    if (dto?.status) {
      qb.andWhere('s.status = :st', { st: dto.status });
    }

    const [list, total] = await qb
      .orderBy('s.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      list,
      total,
      currentPage: dto.page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async findScheduleById(id: string): Promise<ScheduleTaskRecord> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new NotFoundException('schedule task not found');
    }
    const schedule = await this.scheduleRepo.findOne({ where: { id: nid } });
    if (!schedule) {
      throw new NotFoundException('schedule task not found');
    }
    return schedule;
  }

  async deleteScheduleById(id: string): Promise<void> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new NotFoundException('schedule task not found');
    }
    const existed = await this.scheduleRepo.findOne({ where: { id: nid } });
    if (!existed) {
      throw new NotFoundException('schedule task not found');
    }
    await this.scheduleRepo.delete(nid);
  }

  async updateScheduleById(
    id: string,
    dto: ScheduleUpdateDto,
  ): Promise<ScheduleTaskRecord> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new NotFoundException('schedule task not found');
    }
    const row = await this.scheduleRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('schedule task not found');
    }

    const patchKeys = [
      'name',
      'conExpression',
      'isEnabled',
      'status',
      'lastRunAt',
      'nextRunAt',
      'lastError',
    ] as const;
    const hasPatch = patchKeys.some((k) => dto[k] !== undefined);
    if (!hasPatch) {
      throw new BadRequestException('no fields to update');
    }

    if (typeof dto?.name === 'string') row.name = dto.name;
    if (typeof dto?.conExpression === 'string') {
      row.conExpression = dto.conExpression;
    }
    if (typeof dto?.isEnabled === 'boolean') row.isEnabled = dto.isEnabled;
    if (typeof dto?.status === 'string') row.status = dto.status;
    if (dto?.lastRunAt !== undefined) row.lastRunAt = dto.lastRunAt ?? null;
    if (dto?.nextRunAt !== undefined) row.nextRunAt = dto.nextRunAt ?? null;
    if (dto?.lastError !== undefined) row.lastError = dto.lastError ?? null;

    return await this.scheduleRepo.save(row);
  }
}
