import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import {
  AiModelConfig,
  AiModelConfigDocument,
} from 'src/schemas/aiModelConfig/aiModelConfig.schema';
import {
  AiModelConfigCreateDto,
  AiModelConfigQueryDto,
  AiModelConfigUpdateDto,
} from './dto/aiModelConfig.dto';

function isDefined<T>(v: T | undefined | null): v is T {
  return v !== undefined && v !== null;
}

@Injectable()
export class AiModelConfigService {
  constructor(
    @InjectModel(AiModelConfig.name)
    private readonly aiModelConfigModel: Model<AiModelConfigDocument>,
  ) {}

  async create(dto: AiModelConfigCreateDto): Promise<AiModelConfig> {
    const doc = new this.aiModelConfigModel({
      provider: String(dto.provider).trim(),
      modelName: String(dto.modelName).trim(),
      displayName: String(dto.displayName).trim(),
      modelType: String(dto.modelType).trim(),
      apiUrl: String(dto.apiUrl).trim(),
      maxImageCount: dto.maxImageCount ?? 0,
      supportedAspectRatio: dto.supportedAspectRatio ?? [],
      defaultAspectRatio: dto.defaultAspectRatio,
      supportedResolutions: dto.supportedResolutions ?? [],
      defaultResolution: dto.defaultResolution,
      supportedFormats: dto.supportedFormats ?? [],
      maxResolution: dto.maxResolution,
      fieldMappings: dto.fieldMappings ?? {},
      defaultParams: dto.defaultParams ?? {},
      isEnabled: dto.isEnabled ?? true,
      sort: dto.sort ?? 0,
    });

    try {
      return await doc.save();
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err.code === 11000) {
        throw new BadRequestException(
          '该 provider 下已存在相同的 modelName',
        );
      }
      throw new BadRequestException(err.message ?? '创建失败');
    }
  }

  async findList(
    dto: AiModelConfigQueryDto,
  ): Promise<PaginationResponse<AiModelConfig>> {
    const query: FilterQuery<AiModelConfig> = {};
    if (dto.provider?.trim()) {
      query.provider = dto.provider.trim();
    }
    if (dto.modelName?.trim()) {
      query.modelName = { $regex: dto.modelName.trim(), $options: 'i' };
    }
    if (dto.modelType?.trim()) {
      query.modelType = dto.modelType.trim();
    }
    if (typeof dto.isEnabled === 'boolean') {
      query.isEnabled = dto.isEnabled;
    }

    const total = await this.aiModelConfigModel.countDocuments(query).exec();
    const list = await this.aiModelConfigModel
      .find(query)
      .sort({ sort: 1, createdAt: -1 })
      .skip(dto.skip)
      .limit(dto.limit)
      .exec();

    return {
      list,
      total,
      currentPage: dto.page,
      totalPages: Math.ceil(total / dto.pageSize) || 0,
    };
  }

  async findById(id: string): Promise<AiModelConfig> {
    const trimmed = String(id ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('id is required');
    }
    const doc = await this.aiModelConfigModel.findById(trimmed).exec();
    if (!doc) {
      throw new NotFoundException('ai model config not found');
    }
    return doc;
  }

  async deleteById(id: string): Promise<void> {
    const trimmed = String(id ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('id is required');
    }
    const existed = await this.aiModelConfigModel.findById(trimmed).lean().exec();
    if (!existed) {
      throw new NotFoundException('ai model config not found');
    }
    await this.aiModelConfigModel.findByIdAndDelete(trimmed).exec();
  }

  async updateById(
    id: string,
    dto: AiModelConfigUpdateDto,
  ): Promise<AiModelConfig> {
    const trimmed = String(id ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('id is required');
    }

    const update: Partial<AiModelConfig> = {};

    if (isDefined(dto.provider)) update.provider = String(dto.provider).trim();
    if (isDefined(dto.modelName)) update.modelName = String(dto.modelName).trim();
    if (isDefined(dto.displayName)) {
      update.displayName = String(dto.displayName).trim();
    }
    if (isDefined(dto.modelType)) update.modelType = String(dto.modelType).trim();
    if (isDefined(dto.apiUrl)) update.apiUrl = String(dto.apiUrl).trim();
    if (isDefined(dto.maxImageCount)) update.maxImageCount = dto.maxImageCount;
    if (isDefined(dto.supportedAspectRatio)) {
      update.supportedAspectRatio = dto.supportedAspectRatio;
    }
    if (isDefined(dto.defaultAspectRatio)) {
      update.defaultAspectRatio = dto.defaultAspectRatio;
    }
    if (isDefined(dto.supportedResolutions)) {
      update.supportedResolutions = dto.supportedResolutions;
    }
    if (isDefined(dto.defaultResolution)) {
      update.defaultResolution = dto.defaultResolution;
    }
    if (isDefined(dto.supportedFormats)) {
      update.supportedFormats = dto.supportedFormats;
    }
    if (isDefined(dto.maxResolution)) update.maxResolution = dto.maxResolution;
    if (isDefined(dto.fieldMappings)) update.fieldMappings = dto.fieldMappings;
    if (isDefined(dto.defaultParams)) update.defaultParams = dto.defaultParams;
    if (isDefined(dto.isEnabled)) update.isEnabled = dto.isEnabled;
    if (isDefined(dto.sort)) update.sort = dto.sort;

    if (Object.keys(update).length === 0) {
      throw new BadRequestException('no fields to update');
    }

    try {
      const updated = await this.aiModelConfigModel
        .findByIdAndUpdate(trimmed, update, { new: true })
        .exec();
      if (!updated) {
        throw new NotFoundException('ai model config not found');
      }
      return updated;
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err.code === 11000) {
        throw new BadRequestException(
          '该 provider 下已存在相同的 modelName',
        );
      }
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(err.message ?? '更新失败');
    }
  }
}
