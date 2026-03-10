import { Injectable } from "@nestjs/common";
import { RecordDto } from "./dto/record.dto";
import { RecordEntity } from "./entity/record.entity";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Record, RecordDocument } from "src/schemas/record/record.schema";

@Injectable()
export class RecordService {

    constructor(
        @InjectModel(Record.name) private recordSchema: Model<RecordDocument>,
      ) {}
    
      //添加
      async createRecord(recordDto: RecordEntity ): Promise<Record> {
        const createRecord = new this.recordSchema(recordDto);
        return await createRecord.save();
      }
      //查询
      async findRecordList(recordDto:RecordDto): Promise<Record[]> {
        return await this.recordSchema.find(recordDto).exec();
      }
      //删除
      async deleteRecord(id: string): Promise<void> {
        await this.recordSchema.findByIdAndDelete(id).exec();
      }

}