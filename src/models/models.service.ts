import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelsDto } from './dto/models.dto';
import { positiveInt } from 'src/common/dto/pagination-int.util';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
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
import { ModelRecord } from './entities/model-record.entity';
import { UpdateModelDto } from './dto/update-model.dto';

function rowErrorMessage(error: unknown): string {
  if (error == null) return '创建模型失败';
  if (typeof error === 'string') return error;
  const e = error as {
    message?: unknown;
    errors?: Record<string, { message?: string }>;
  };
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

@Injectable()
export class ModelService {
  constructor(
    @InjectRepository(ModelRecord)
    private readonly modelRepo: Repository<ModelRecord>,
    private readonly encryptionService: EncryptionService,
    private readonly keyService: KeyService,
  ) {}

  async createModel(modelDto: ModelsEntity): Promise<ModelRecord> {
    try {
      modelDto.status = '1';
      const entity = this.modelRepo.create({
        modelName: modelDto.modelName,
        modelClassify: modelDto.modelClassify,
        description: modelDto.description,
        status: modelDto.status,
        modelType: modelDto.modelType ?? null,
      });
      return await this.modelRepo.save(entity);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('createModel error:', error);
      throw new BadRequestException(rowErrorMessage(error));
    }
  }

  async findModelList(
    modelDto: ModelsDto,
  ): Promise<PaginationResponse<ModelRecord>> {
    const qb = this.modelRepo.createQueryBuilder('m');
    if (modelDto.modelName) {
      qb.andWhere('m.modelName = :modelName', {
        modelName: modelDto.modelName,
      });
    }
    if (modelDto.modelClassify) {
      qb.andWhere('m.modelClassify = :modelClassify', {
        modelClassify: modelDto.modelClassify,
      });
    }
    if (modelDto.status) {
      qb.andWhere('m.status = :status', { status: modelDto.status });
    }

    qb.orderBy('m.createdAt', 'DESC');

    const noPaging =
      modelDto.page === undefined && modelDto.pageSize === undefined;

    if (noPaging) {
      const [list, total] = await qb.getManyAndCount();
      return {
        list,
        total,
        currentPage: 1,
        totalPages: total === 0 ? 0 : 1,
      };
    }

    const page =
      modelDto.page !== undefined
        ? positiveInt(modelDto.page, 1)
        : 1;
    const pageSize =
      modelDto.pageSize !== undefined
        ? positiveInt(modelDto.pageSize, 10)
        : 10;
    const skip = (page - 1) * pageSize;

    const [list, total] = await qb.skip(skip).take(pageSize).getManyAndCount();

    return {
      list,
      total,
      currentPage: page,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }

  async updateModel(dto: UpdateModelDto): Promise<ModelRecord> {
    const nid = parsePositiveIntId(dto.id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    if (
      dto.modelName === undefined &&
      dto.status === undefined &&
      dto.modelType === undefined
    ) {
      throw new BadRequestException('至少提供 modelName、status、modelType 中的一项');
    }
    const row = await this.modelRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('model not found');
    }
    if (dto.modelName !== undefined) {
      row.modelName = dto.modelName;
    }
    if (dto.status !== undefined) {
      row.status = dto.status;
    }
    if (dto.modelType !== undefined) {
      row.modelType = dto.modelType === '' ? null : dto.modelType;
    }
    try {
      return await this.modelRepo.save(row);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('updateModel error:', error);
      throw new BadRequestException(rowErrorMessage(error));
    }
  }

  async findModelById(id: string): Promise<ModelRecord | null> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      return null;
    }
    return await this.modelRepo.findOne({ where: { id: nid } });
  }

  async disableModel(id: string): Promise<Record<string, unknown>> {
    return this.setModelStatus(id, '0');
  }

  async enableModel(id: string): Promise<Record<string, unknown>> {
    return this.setModelStatus(id, '1');
  }

  private async setModelStatus(
    id: string,
    status: string,
  ): Promise<Record<string, unknown>> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    const row = await this.modelRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('model not found');
    }
    row.status = status;
    const updated = await this.modelRepo.save(row);
    return { ...updated } as Record<string, unknown>;
  }

  async deleteModel(id: string): Promise<{ message: string }> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    const res = await this.modelRepo.delete(nid);
    if (!res.affected) {
      throw new NotFoundException('model not found');
    }
    return { message: '删除成功' };
  }

  async findClassifyList(): Promise<string[]> {
    const raw = await this.modelRepo
      .createQueryBuilder('m')
      .select('DISTINCT m.modelClassify', 'c')
      .where('m.modelClassify IS NOT NULL')
      .andWhere("m.modelClassify != ''")
      .getRawMany<{ c: string }>();
    return raw.map((r) => r.c).filter(Boolean);
  }

  async findModelByModelNameAndModelClassify(
    modelName: string,
    modelClassify: string,
  ): Promise<ModelRecord | null> {
    return await this.modelRepo.findOne({
      where: { modelName, modelClassify },
    });
  }

  private async existsModelByNameAndClassify(
    modelName: string,
    modelClassify: string,
  ): Promise<boolean> {
    const cnt = await this.modelRepo.count({
      where: { modelName, modelClassify },
    });
    return cnt > 0;
  }

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
          const entity = this.modelRepo.create({
            modelName: openaiId,
            modelClassify: classify,
            status: '0',
            modelType: null,
          });
          await this.modelRepo.save(entity);
          added += 1;
        } catch (err) {
          if (err instanceof HttpException) {
            throw err;
          }
          console.error('listOpenAIModelsByClassify save error:', err);
          throw new BadRequestException(rowErrorMessage(err));
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
