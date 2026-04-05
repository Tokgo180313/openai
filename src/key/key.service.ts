import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { ApiKey, ApiKeyDocument } from 'src/schemas/key/key.schema';
import { KeyDto, KeyQueryDto, KeyUpdateDto } from './dto/key.dto';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

    const modelClassify = KeyService.normalizeModelClassify(dto.modelClassify);
    const createKey = new this.keySchema({
      ...dto,
      modelClassify,
      apiKey: this.encryptionService.encrypt(dto.apiKey),
    } as ApiKey);

    return await createKey.save();
  }

  // 查：列表
  async findKeyList(dto: KeyQueryDto): Promise<ApiKey[]> {
    const query: Record<string, unknown> = {};
    if (dto?.modelClassify) {
      const c = KeyService.normalizeModelClassify(dto.modelClassify);
      query.modelClassify = {
        $regex: new RegExp(`^${escapeRegex(c)}$`, 'i'),
      };
    }
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
    if (dto?.modelClassify)
      update.modelClassify = KeyService.normalizeModelClassify(dto.modelClassify);
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

  /**
   * 根据 modelClassify 查单条；若存在多条则取最近更新的一条。
   * modelClassify 不区分大小写，统一按小写参与匹配；写入时也应为小写（见 create/update）。
   * 返回的 apiKey 仍为库中密文，由全局序列化拦截器脱敏处理。
   */
  async findKeyByModelClassify(modelClassify: string): Promise<ApiKey | null> {
    const classify = KeyService.normalizeModelClassify(modelClassify);
    if (!classify) {
      throw new BadRequestException('modelClassify is required');
    }
    return await this.keySchema
      .findOne({
        modelClassify: {
          $regex: new RegExp(`^${escapeRegex(classify)}$`, 'i'),
        },
      })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  private static normalizeModelClassify(raw: string): string {
    return String(raw ?? '').trim().toLowerCase();
  }
}

