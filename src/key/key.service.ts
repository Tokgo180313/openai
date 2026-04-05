import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { ApiKey, ApiKeyDocument } from 'src/schemas/key/key.schema';
import { KeyDto, KeyQueryDto, KeyUpdateDto } from './dto/key.dto';

@Injectable()
export class KeyService {
  constructor(
    @InjectModel(ApiKey.name) private readonly keySchema: Model<ApiKeyDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  // 增
  async createKey(dto: KeyDto): Promise<ApiKey> {
    if (!dto?.apiKey || !dto?.modelClassify) {
      throw new BadRequestException('apiKey, modelClassify, baseURL are required');
    }

    const createKey = new this.keySchema({
      ...dto,
      apiKey: this.encryptionService.encrypt(dto.apiKey),
    } as ApiKey);

    return await createKey.save();
  }

  // 查：列表
  async findKeyList(dto: KeyQueryDto): Promise<ApiKey[]> {
    const query: Partial<Record<keyof KeyQueryDto, unknown>> = {};
    if (dto?.modelClassify) query.modelClassify = dto.modelClassify;
    if (dto?.baseURL) query.baseURL = dto.baseURL;

    return await this.keySchema.find(query).lean().exec();
  }

  // 查：单条
  async findKeyById(id: string): Promise<ApiKey | null> {
    return await this.keySchema.findById(id).lean().exec();
  }

  // 删
  async deleteKeyById(id: string): Promise<void> {
    const existed = await this.keySchema.findById(id).lean().exec();
    if (!existed) {
      throw new NotFoundException('key not found');
    }
    await this.keySchema.findByIdAndDelete(id).exec();
  }

  // 改
  async updateKeyById(id: string, dto: KeyUpdateDto): Promise<ApiKey | null> {
    const update: any = {};
    if (dto?.modelClassify) update.modelClassify = dto.modelClassify;
    if (dto?.baseURL) update.baseURL = dto.baseURL;
    if (dto?.apiKey) update.apiKey = this.encryptionService.encrypt(dto.apiKey);

    if (Object.keys(update).length === 0) {
      throw new BadRequestException('no fields to update');
    }

    return await this.keySchema
      .findByIdAndUpdate(id, update, { new: true })
      .lean()
      .exec();
  }
}

