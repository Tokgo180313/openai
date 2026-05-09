import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { RecordService } from 'src/record/record.service';
import { UserService } from 'src/user/user.service';
import { UsageDto } from './dto/usage.dto';
import { UsageEntity } from './entity/usage.entity';
import { RecordEntity } from 'src/record/entity/record.entity';
import { GeminiUsageEntity } from './entity/gemini.usage.entity';
import { UsageRecord } from './entities/usage-record.entity';

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageRecord)
    private readonly usageRepo: Repository<UsageRecord>,
    private readonly recordService: RecordService,
    private readonly userService: UserService,
  ) {}

  async findUsageList(
    usageDto: UsageDto,
  ): Promise<PaginationResponse<UsageRecord>> {
    const { skip, limit } = usageDto;
    const qb = this.usageRepo.createQueryBuilder('u');

    if (usageDto.account) {
      qb.andWhere('u.account = :account', { account: usageDto.account });
    }
    if (usageDto.modelName) {
      qb.andWhere('u.modelName = :modelName', { modelName: usageDto.modelName });
    }
    if (usageDto.modelClassify) {
      qb.andWhere('u.modelClassify = :modelClassify', {
        modelClassify: usageDto.modelClassify,
      });
    }
    if (usageDto.startTime) {
      qb.andWhere('u.createdAt >= :startTime', {
        startTime: new Date(usageDto.startTime),
      });
    }
    if (usageDto.endTime) {
      qb.andWhere('u.createdAt <= :endTime', {
        endTime: new Date(usageDto.endTime),
      });
    }

    const [data, total] = await qb
      .orderBy('u.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      list: data,
      total,
      currentPage: usageDto.page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async deleteById(id: string, userId: string): Promise<void> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new NotFoundException('usage not found');
    }
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const res = await this.usageRepo.delete(nid);
    if (!res.affected) {
      throw new NotFoundException('usage not found');
    }
    const record: RecordEntity = {
      nickName: user.nickName,
      account: user.account,
      description: 'usage deleted: ' + String(nid),
    };
    await this.recordService.createRecord(record);
  }

  async addUsage(usageDto: UsageEntity, id: string): Promise<UsageRecord> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const entity = this.usageRepo.create({
      nickName: user.nickName,
      account: user.account,
      modelName: usageDto.modelName,
      modelClassify: usageDto.modelClassify,
      promptTokens: usageDto.promptTokens,
      completionTokens: usageDto.completionTokens,
      totalTokens: usageDto.totalTokens,
      description: usageDto.description,
      thoughtsTokens: usageDto.thoughtsTokens,
      status: usageDto.status ?? '0',
    });
    return await this.usageRepo.save(entity);
  }

  async updateUsage(id: string, status: string): Promise<UsageRecord> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new NotFoundException('usage not found');
    }
    const existing = await this.usageRepo.findOne({ where: { id: nid } });
    if (!existing) {
      throw new NotFoundException('usage not found');
    }
    existing.status = status;
    return await this.usageRepo.save(existing);
  }

  async addUsageByGemini(
    usageDto: GeminiUsageEntity,
    id: string,
    modelName: string,
    status: string,
  ): Promise<UsageRecord> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const entity = this.usageRepo.create({
      nickName: user.nickName,
      account: user.account,
      modelName,
      modelClassify: 'Gemini',
      promptTokens: usageDto?.promptTokenCount,
      completionTokens: usageDto?.candidatesTokenCount,
      totalTokens: usageDto?.totalTokenCount,
      thoughtsTokens: usageDto?.thoughtsTokenCount,
      status,
    });
    return await this.usageRepo.save(entity);
  }
}
