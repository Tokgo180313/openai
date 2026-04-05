import { Injectable } from '@nestjs/common';
import { ModelsDto } from './dto/models.dto';
import { Models, ModelDocument } from 'src/schemas/models/models.schema';
import { FilterQuery, Model } from 'mongoose';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { InjectModel } from '@nestjs/mongoose';
import { RecordService } from 'src/record/record.service';
import { EncryptionService } from 'src/common/utils/encryption.service';
import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ModelsEntity } from './entity/models.entity';

function mongoErrorMessage(error: unknown): string {
  if (error == null) return '创建模型失败';
  if (typeof error === 'string') return error;
  const e = error as { message?: unknown; errors?: Record<string, { message?: string }> };
  if (typeof e.message === 'string') return e.message;
  if (Array.isArray(e.message)) return e.message.map(String).join('; ');
  if (e.errors && typeof e.errors === 'object') {
    const parts = Object.values(e.errors)
      .map((v) => v?.message)
      .filter(Boolean) as string[];
    if (parts.length) return parts.join('; ');
  }
  return '创建模型失败';
}

/** 未删除：无 status 或 status 不为 "0"（软删除） */
const notDeletedFilter: FilterQuery<Models> = {
  status: { $ne: '0' },
};

@Injectable()
export class ModelService {
  constructor(
    @InjectModel(Models.name) private modelSchema: Model<ModelDocument>,
    private readonly encryptionService: EncryptionService,
    private recordService: RecordService,
  ) {}

  //添加
  async createModel(modelDto: ModelsEntity): Promise<Models> {
    try {
      modelDto.status = '1';
      const createModel = new this.modelSchema(modelDto);
      return await createModel.save();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('createModel error:', error);
      throw new BadRequestException(mongoErrorMessage(error));
    }
  }
  //查询（分页）
  async findModelList(
    modelDto: ModelsDto,
  ): Promise<PaginationResponse<Models>> {
    const query: FilterQuery<Models> = { ...notDeletedFilter };
    if (modelDto.modelName) query.modelName = modelDto.modelName;
    if (modelDto.modelClassify) query.modelClassify = modelDto.modelClassify;

    const { skip, limit, page, pageSize } = modelDto;
    const total = await this.modelSchema.countDocuments(query).exec();
    const list = await this.modelSchema
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      list,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  //get by id
  async findModelById(id: string): Promise<Models | null> {
    return await this.modelSchema.findById(id).exec();
  }
  //删除（软删除：status 置为 "0"）
  async deleteModel(id: string): Promise<Record<string, unknown>> {
    const trimmed = String(id ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('id is required');
    }
    const updated = await this.modelSchema
      .findByIdAndUpdate(trimmed, { status: '0' }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('model not found');
    }
    return updated.toJSON() as Record<string, unknown>;
  }

  //查询分类列表
  async findClassifyList(): Promise<string[]> {
    return await this.modelSchema
      .distinct('modelClassify', notDeletedFilter)
      .exec();
  }
  //查询模型名称和分类
  async findModelByModelNameAndModelClassify(modelName: string, modelClassify: string): Promise<Models | null> {
    return await this.modelSchema
      .findOne({ modelName, modelClassify, ...notDeletedFilter })
      .exec();
  }
}
