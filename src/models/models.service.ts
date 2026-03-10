import { Injectable } from "@nestjs/common";
import { ModelsDto } from "./dto/models.dto";
import { ModelsEntity } from "./entity/models.entity";
import { Models, ModelDocument } from "src/schemas/models/models.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Record, RecordDocument } from "src/schemas/record/record.schema";
@Injectable()
export class ModelService {

    constructor(
        @InjectModel(Models.name) private modelSchema: Model<ModelDocument>,
        @InjectModel(Record.name) private recordSchema: Model<RecordDocument>
      ) {}
    
      //添加
      async createModel(modelDto: ModelsEntity ): Promise<Models> {
        const createModel = new this.modelSchema(modelDto);
        console.log("Creating model with data:", modelDto);
        createModel.save().then((res) => {
          console.log("Model created successfully:", res);
        }).catch((err) => {
          console.error("Error creating model:", err);
        });
        return createModel;
      }
      //查询
      async findModelList(modelDto:ModelsDto): Promise<Models[]> {
        return await this.modelSchema.find(modelDto).exec();
      }
      //get by id
      async findModelById(id: string): Promise<Models | null> {
        return await this.modelSchema.findById(id).exec();
      }
      //删除
      async deleteModel(id: string): Promise<void> {
        await this.modelSchema.findByIdAndDelete(id).exec();
      }

      //查询分类列表
      async findClassifyList(): Promise<string[]> {
        return await this.modelSchema.distinct('modelClassify').exec();
      }
     
}