import { ModelDto } from "./dto/model.dto";
import { ModelEntity } from "./entity/model.entity";

export class ModelService {

    constructor(
        @InjectModel(Model.name) private modelSchema: Model<ModelDocument>,
      ) {}
    
      //添加
      async createModel(modelDto: ModelEntity ): Promise<Model> {
        const createModel = new this.modelSchema(modelDto);
        return await createModel.save();
      }
      //查询
      async findModelList(modelDto:ModelDto): Promise<Model[]> {
        return await this.modelSchema.find(modelDto).exec();
      }
      //get by id
      async findModelById(id: string): Promise<Model | null> {
        return await this.modelSchema.findById(id).exec();
      }
      //删除
      async deleteModel(id: string): Promise<void> {
        await this.modelSchema.findByIdAndDelete(id).exec();
      }

      //查询分类列表
      async findClassifyList(): Promise<string[]> {
        return await this.modelSchema.distinct('classify').exec();
      }
     
}