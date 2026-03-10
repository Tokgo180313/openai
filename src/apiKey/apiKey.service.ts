import { Injectable } from '@nestjs/common';
import { ApiKeyDto } from './dto/apiKey.dto';
import { ApiKeyEntity } from './entity/apiKey.entity';
import { ApiKey, ApiKeyDocument } from 'src/schemas/apiKey/apiKey.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
@Injectable()
export class ApiKeyService {
  constructor(
    // 注入ApiKey模型
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
  ) {}
  //添加
  async createApiKey(apiKeyDto: ApiKeyEntity): Promise<ApiKey> {
    // 实现创建API Key的逻辑
    const createApiKey = new this.apiKeyModel(apiKeyDto);
    return await createApiKey.save();
  }

  //查询
  async findApiKeyList(apiKeyDto: ApiKeyDto): Promise<ApiKey[]> {
    // 实现查询API Key列表的逻辑
    return this.apiKeyModel.find(apiKeyDto).exec();
  }

  //删除
  async deleteApiKey(id: string): Promise<void> {
    // 实现删除API Key的逻辑
    await this.apiKeyModel.findByIdAndDelete(id).exec();
  }
}
