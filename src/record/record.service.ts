import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordDto } from './dto/record.dto';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { RecordEntity } from './entity/record.entity';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { OperationRecord } from './entities/operation-record.entity';

@Injectable()
export class RecordService {
  constructor(
    @InjectRepository(OperationRecord)
    private readonly recordRepo: Repository<OperationRecord>,
  ) {}

  async createRecord(recordDto: RecordEntity): Promise<OperationRecord> {
    const entity = this.recordRepo.create({
      nickName: recordDto.nickName,
      account: recordDto.account,
      description: recordDto.description,
    });
    return await this.recordRepo.save(entity);
  }

  async findRecordList(
    recordDto: RecordDto,
  ): Promise<PaginationResponse<OperationRecord>> {
    const qb = this.recordRepo.createQueryBuilder('r');

    if (recordDto.account && recordDto.account !== '') {
      qb.andWhere('r.account = :account', { account: recordDto.account });
    }
    if (recordDto.modelName && recordDto.modelName !== '') {
      qb.andWhere('r.description LIKE :mn', {
        mn: `%${recordDto.modelName}%`,
      });
    }
    if (recordDto.classify && recordDto.classify !== '') {
      qb.andWhere('r.description LIKE :cl', {
        cl: `%${recordDto.classify}%`,
      });
    }
    if (recordDto.startTime) {
      qb.andWhere('r.createdAt >= :startTime', {
        startTime: new Date(recordDto.startTime),
      });
    }
    if (recordDto.endTime) {
      qb.andWhere('r.createdAt <= :endTime', {
        endTime: new Date(recordDto.endTime),
      });
    }

    const { skip, limit } = recordDto;
    const [data, total] = await qb
      .orderBy('r.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      list: data,
      total,
      currentPage: recordDto.page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async deleteRecord(id: string): Promise<void> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      return;
    }
    await this.recordRepo.delete(nid);
  }
}
