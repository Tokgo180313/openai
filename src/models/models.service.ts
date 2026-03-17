import { Injectable } from "@nestjs/common";
import { ModelsDto } from "./dto/models.dto";
import { Models, ModelDocument } from "src/schemas/models/models.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { RecordService } from "src/record/record.service";
import { EncryptionService } from "src/common/utils/encryption.service";
@Injectable()
export class ModelService {

    constructor(
        @InjectModel(Models.name) private modelSchema: Model<ModelDocument>,
        private readonly encryptionService: EncryptionService,
        private recordService: RecordService
      ) {}
    
      //添加
      async createModel(modelDto: Models ): Promise<Models> {
        const createModel = new this.modelSchema(modelDto);
        createModel.apiKey = this.encryptionService.encrypt(createModel.apiKey);
        return await createModel.save();
      }
      //查询
      async findModelList(modelDto:ModelsDto): Promise<Models[]> {
        return await this.modelSchema.find(modelDto).lean().exec();
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
      //更新apiKey
      async updateApiKey(modelDto:ModelsDto): Promise<Models> {
        const models = await this.findModelList(modelDto); 
        if(models.length > 0){
          return await this.modelSchema.findByIdAndUpdate(models[0]._id, {apiKey:this.encryptionService.encrypt(modelDto.apiKey)}).exec();
        }
        return null;
      }
}