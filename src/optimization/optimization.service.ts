import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { CopyOptimization } from './entities/copy-optimization.entity';
import {
  CopyOptimizationQueryDto,
  CreateCopyOptimizationDto,
} from './dto/optimization.dto';

@Injectable()
export class OptimizationService {
  constructor(
    @InjectRepository(CopyOptimization)
    private readonly repo: Repository<CopyOptimization>,
  ) {}

  async create(
    userId: string,
    dto: CreateCopyOptimizationDto,
  ): Promise<CopyOptimization> {
    const entity = this.repo.create({
      userId,
      content: String(dto.content).trim(),
      type: String(dto.type).trim(),
      status: dto.status ?? '1',
    });
    return this.repo.save(entity);
  }

  async findList(
    userId: string,
    dto: CopyOptimizationQueryDto,
  ): Promise<PaginationResponse<CopyOptimization>> {
    const qb = this.repo
      .createQueryBuilder('o')
      .where('o.user_id = :userId', { userId });

    if (dto.type?.trim()) {
      qb.andWhere('o.type = :type', { type: dto.type.trim() });
    }
    if (dto.status && dto.status !== '') {
      qb.andWhere('o.status = :status', { status: dto.status });
    }
    if (dto.content?.trim()) {
      qb.andWhere('o.content LIKE :content', {
        content: `%${dto.content.trim()}%`,
      });
    }

    const [list, total] = await qb
      .orderBy('o.created_at', 'DESC')
      .skip(dto.skip)
      .take(dto.limit)
      .getManyAndCount();

    return {
      list,
      total,
      currentPage: dto.page,
      totalPages: Math.ceil(total / dto.pageSize) || 0,
    };
  }
}
