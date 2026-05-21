import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { positiveInt } from 'src/common/dto/pagination-int.util';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { ProviderService } from 'src/provider/provider.service';
import {
  normalizeOpenAIBaseURL,
  OPENAI_DEFAULT_BASE_URL,
} from 'src/common/utils/openai-base-url.util';
import { AiModel } from './entities/ai-model.entity';
import {
  AiModelCreateDto,
  AiModelQueryDto,
  AiModelUpdateDto,
} from './dto/ai-models.dto';

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
export class AiModelsService {
  constructor(
    @InjectRepository(AiModel)
    private readonly aiModelRepo: Repository<AiModel>,
    private readonly encryptionService: EncryptionService,
    private readonly providerService: ProviderService,
  ) {}

  async create(dto: AiModelCreateDto): Promise<AiModel> {
    try {
      const provider = AiModelsService.normalizeProvider(dto.provider);
      const modelCode = String(dto.modelCode).trim();
      const apiModelName = String(dto.apiModelName).trim();
      if (!modelCode || !apiModelName) {
        throw new BadRequestException('modelCode 与 apiModelName 必填');
      }

      const entity = this.aiModelRepo.create({
        provider,
        modelCode,
        apiModelName,
        modelType: String(dto.modelType).trim(),
        baseUrl: dto.baseUrl?.trim() || null,
        enabled: 1,
        sort: dto.sort ?? 100,
      });
      return await this.aiModelRepo.save(entity);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('create ai model error:', error);
      throw new BadRequestException(rowErrorMessage(error));
    }
  }

  async findList(
    dto: AiModelQueryDto,
  ): Promise<PaginationResponse<AiModel>> {
    const qb = this.aiModelRepo.createQueryBuilder('m');

    if (dto.provider) {
      const p = AiModelsService.normalizeProvider(dto.provider);
      qb.andWhere('LOWER(m.provider) = :provider', { provider: p });
    }
    if (dto.modelCode) {
      qb.andWhere('m.modelCode = :modelCode', {
        modelCode: dto.modelCode.trim(),
      });
    }
    if (dto.modelType) {
      qb.andWhere('m.modelType = :modelType', {
        modelType: dto.modelType.trim(),
      });
    }
    if (dto.enabled !== undefined && dto.enabled !== '') {
      qb.andWhere('m.enabled = :enabled', { enabled: Number(dto.enabled) });
    }

    qb.orderBy('m.sort', 'ASC').addOrderBy('m.createdAt', 'DESC');

    const noPaging =
      dto.page === undefined && dto.pageSize === undefined;

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
      dto.page !== undefined ? positiveInt(dto.page, 1) : 1;
    const pageSize =
      dto.pageSize !== undefined ? positiveInt(dto.pageSize, 10) : 10;
    const skip = (page - 1) * pageSize;

    const [list, total] = await qb.skip(skip).take(pageSize).getManyAndCount();

    return {
      list,
      total,
      currentPage: page,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }

  async update(dto: AiModelUpdateDto): Promise<AiModel> {
    const nid = parsePositiveIntId(dto.id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }

    const touched =
      dto.provider !== undefined ||
      dto.modelCode !== undefined ||
      dto.apiModelName !== undefined ||
      dto.modelType !== undefined ||
      dto.baseUrl !== undefined ||
      dto.sort !== undefined ||
      dto.enabled !== undefined;

    if (!touched) {
      throw new BadRequestException(
        '至少提供 provider、modelCode、apiModelName、modelType、baseUrl、sort、enabled 中的一项',
      );
    }

    const row = await this.aiModelRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('ai model not found');
    }

    if (dto.provider !== undefined) {
      row.provider = AiModelsService.normalizeProvider(dto.provider);
    }
    if (dto.modelCode !== undefined) {
      row.modelCode = String(dto.modelCode).trim();
    }
    if (dto.apiModelName !== undefined) {
      row.apiModelName = String(dto.apiModelName).trim();
    }
    if (dto.modelType !== undefined) {
      row.modelType = String(dto.modelType).trim();
    }
    if (dto.baseUrl !== undefined) {
      row.baseUrl = dto.baseUrl.trim() || null;
    }
    if (dto.sort !== undefined) {
      row.sort = dto.sort;
    }
    if (dto.enabled !== undefined) {
      row.enabled = dto.enabled === '1' ? 1 : 0;
    }

    try {
      return await this.aiModelRepo.save(row);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('update ai model error:', error);
      throw new BadRequestException(rowErrorMessage(error));
    }
  }

  async findById(id: string): Promise<AiModel | null> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      return null;
    }
    return await this.aiModelRepo.findOne({ where: { id: nid } });
  }

  async disableById(id: string): Promise<Record<string, unknown>> {
    return this.setEnabled(id, 0);
  }

  async enableById(id: string): Promise<Record<string, unknown>> {
    return this.setEnabled(id, 1);
  }

  private async setEnabled(
    id: string,
    enabled: number,
  ): Promise<Record<string, unknown>> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    const row = await this.aiModelRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('ai model not found');
    }
    row.enabled = enabled;
    const updated = await this.aiModelRepo.save(row);
    return { ...updated } as Record<string, unknown>;
  }

  async deleteById(id: string): Promise<{ message: string }> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    const res = await this.aiModelRepo.delete(nid);
    if (!res.affected) {
      throw new NotFoundException('ai model not found');
    }
    return { message: '删除成功' };
  }

  async findProviderList(): Promise<string[]> {
    const raw = await this.aiModelRepo
      .createQueryBuilder('m')
      .select('DISTINCT m.provider', 'p')
      .where("m.provider IS NOT NULL AND m.provider != ''")
      .getRawMany<{ p: string }>();
    return raw.map((r) => r.p).filter(Boolean);
  }

  async findByProviderAndModelCode(
    provider: string,
    modelCode: string,
  ): Promise<AiModel | null> {
    const p = AiModelsService.normalizeProvider(provider);
    const code = String(modelCode ?? '').trim();
    if (!p || !code) {
      return null;
    }
    return await this.aiModelRepo.findOne({
      where: { provider: p, modelCode: code },
    });
  }

  private async existsByProviderAndModelCode(
    provider: string,
    modelCode: string,
  ): Promise<boolean> {
    const cnt = await this.aiModelRepo.count({
      where: { provider, modelCode },
    });
    return cnt > 0;
  }

  async syncOpenAIModelsByProvider(provider: string): Promise<{
    message: string;
    added: number;
    skipped: number;
  }> {
    const normalized = AiModelsService.normalizeProvider(provider);
    if (!normalized) {
      throw new BadRequestException('provider is required');
    }

    const keyDoc = await this.providerService.findByProvider(normalized);
    if (!keyDoc?.apiKey) {
      throw new NotFoundException(
        `no api key configured for provider: ${normalized}`,
      );
    }
    const rawBase = String(keyDoc.baseURL ?? '').trim();
    if (!rawBase) {
      throw new NotFoundException(
        `no baseURL configured for provider: ${normalized}`,
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

        if (
          await this.existsByProviderAndModelCode(normalized, openaiId)
        ) {
          skipped += 1;
          continue;
        }

        try {
          const entity = this.aiModelRepo.create({
            provider: normalized,
            modelCode: openaiId,
            apiModelName: openaiId,
            modelType: 'text',
            baseUrl: null,
            enabled: 0,
            sort: 100,
          });
          await this.aiModelRepo.save(entity);
          added += 1;
        } catch (err) {
          if (err instanceof HttpException) {
            throw err;
          }
          console.error('syncOpenAIModelsByProvider save error:', err);
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

  private static normalizeProvider(raw: string): string {
    return String(raw ?? '').trim().toLowerCase();
  }
}
