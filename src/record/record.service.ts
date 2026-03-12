import { Injectable } from '@nestjs/common';
import { RecordDto } from './dto/record.dto';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Record, RecordDocument } from 'src/schemas/record/record.schema';
import { RecordEntity } from './entity/record.entity';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
@Injectable()
export class RecordService {
  constructor(
    @InjectModel(Record.name) private recordSchema: Model<RecordDocument>,
  ) {}

  //添加
  async createRecord(recordDto: RecordEntity): Promise<Record> {
    const createRecord = new this.recordSchema(recordDto);
    return await createRecord.save();
  }
  //查询
  async findRecordList(recordDto: RecordDto): Promise<PaginationResponse<Record>> {
    const query: FilterQuery<Record> = {};
    if (recordDto.account && recordDto.account !== '') {
      query.account = recordDto.account;
    }
    if (recordDto.modelName && recordDto.modelName !== '') {
      query.modelName = recordDto.modelName;
    }
    if (recordDto.classify && recordDto.classify !== '') {
      query.classify = recordDto.classify;
    }
    if (recordDto.startTime ) {
      query.startTime = recordDto.startTime;
    }
    if (recordDto.endTime) {
      query.endTime = recordDto.endTime;
    }
    const { skip, limit } = recordDto;
    const total = await this.recordSchema.countDocuments(query).exec();
    const data = await this.recordSchema
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
    return {
      list: data,
      total,
      currentPage: skip / limit + 1,
      totalPages: Math.ceil(total / limit), 
    };
  }
  //删除
  async deleteRecord(id: string): Promise<void> {
    await this.recordSchema.findByIdAndDelete(id).exec();
  }
}
