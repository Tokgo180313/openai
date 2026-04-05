import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ModelsDto } from './dto/models.dto';
import { Models, ModelDocument } from 'src/schemas/models/models.schema';
import { FilterQuery, Model } from 'mongoose';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { InjectModel } from '@nestjs/mongoose';
import { RecordService } from 'src/record/record.service';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { KeyService } from 'src/key/key.service';
import {
  normalizeOpenAIBaseURL,
  OPENAI_DEFAULT_BASE_URL,
} from 'src/common/utils/openai-base-url.util';
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

/**
 * findClassifyList / findModelByModelNameAndModelClassify 使用的公共条件。
 * findModelList 单独构造 query，不按 status 过滤（需包含 status 为「0」的停用数据）。
 */
const notDeletedFilter: FilterQuery<Models> = {};

@Injectable()
export class ModelService {
  constructor(
    @InjectModel(Models.name) private modelSchema: Model<ModelDocument>,
    private readonly encryptionService: EncryptionService,
    private recordService: RecordService,
    private readonly keyService: KeyService,
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
  //查询（分页，不过滤 status，含停用「0」）
  async findModelList(
    modelDto: ModelsDto,
  ): Promise<PaginationResponse<Models>> {
    const query: FilterQuery<Models> = {};
    if (modelDto.modelName) query.modelName = modelDto.modelName;
    if (modelDto.modelClassify) query.modelClassify = modelDto.modelClassify;
    if (modelDto.status) query.status = modelDto.status;

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
  /** 停用：status → "0" */
  async disableModel(id: string): Promise<Record<string, unknown>> {
    return this.setModelStatus(id, '0');
  }

  /** 启用：status → "1" */
  async enableModel(id: string): Promise<Record<string, unknown>> {
    return this.setModelStatus(id, '1');
  }

  private async setModelStatus(
    id: string,
    status: string,
  ): Promise<Record<string, unknown>> {
    const trimmed = String(id ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('id is required');
    }
    const updated = await this.modelSchema
      .findByIdAndUpdate(trimmed, { status }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('model not found');
    }
    return updated.toJSON() as Record<string, unknown>;
  }

  /** 物理删除 */
  async deleteModel(id: string): Promise<{ message: string }> {
    const trimmed = String(id ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('id is required');
    }
    const deleted = await this.modelSchema.findByIdAndDelete(trimmed).exec();
    if (!deleted) {
      throw new NotFoundException('model not found');
    }
    return { message: '删除成功' };
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

  /** 是否存在同名同分类记录（含 status 为「0」等，用于去重入库） */
  private async existsModelByNameAndClassify(
    modelName: string,
    modelClassify: string,
  ): Promise<boolean> {
    const one = await this.modelSchema
      .findOne({ modelName, modelClassify })
      .select('_id')
      .lean()
      .exec();
    return !!one;
  }

  /**
   * 根据 modelClassify 从密钥表取 apiKey/baseURL，调用 OpenAI `GET /v1/models` 拉取远端模型列表；
   * 将远端模型写入库（m.id → modelName，modelClassify 为入参，status 默认「0」），已存在则跳过。
   */
  async listOpenAIModelsByClassify(modelClassify: string): Promise<{
    message: string;
    added: number;
    skipped: number;
  }> {
    const classify = String(modelClassify ?? '').trim();
    if (!classify) {
      throw new BadRequestException('modelClassify is required');
    }

    const keyDoc = await this.keyService.findKeyByModelClassify(classify);
    if (!keyDoc?.apiKey) {
      throw new NotFoundException(
        `no api key configured for modelClassify: ${classify}`,
      );
    }
    const rawBase = String(keyDoc.baseURL ?? '').trim();
    if (!rawBase) {
      throw new NotFoundException(
        `no baseURL configured for modelClassify: ${classify}`,
      );
    }

    let apiKey: string;
    try {
      apiKey = this.encryptionService.decrypt(keyDoc.apiKey);
    } catch {
      throw new BadRequestException('failed to decrypt stored apiKey');
    }

    const baseURL =
      normalizeOpenAIBaseURL(rawBase) ?? OPENAI_DEFAULT_BASE_URL;
    const openai = new OpenAI({ apiKey, baseURL });

    try {
      const res = await openai.models.list();
      const rows = res.data ?? [];

      let added = 0;
      let skipped = 0;

      for (const m of rows) {
        const openaiId = String(m?.id ?? '').trim();
        if (!openaiId) continue;

        if (await this.existsModelByNameAndClassify(openaiId, classify)) {
          skipped += 1;
          continue;
        }

        try {
          const doc = new this.modelSchema({
            modelName: openaiId,
            modelClassify: classify,
            status: '0',
          });
          await doc.save();
          added += 1;
        } catch (err) {
          if (err instanceof HttpException) {
            throw err;
          }
          console.error('listOpenAIModelsByClassify save error:', err);
          throw new BadRequestException(mongoErrorMessage(err));
        }
      }

      return {
        message: '更新成功',
        added,
        skipped,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      const msg =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'OpenAI models.list failed';
      throw new BadRequestException(msg);
    }
  }
}
