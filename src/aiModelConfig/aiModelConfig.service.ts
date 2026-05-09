import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import {
  AiModelConfigEntity,
  FieldMappingsJson,
} from './entities/ai-model-config.entity';
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
    @InjectRepository(AiModelConfigEntity)
    private readonly repo: Repository<AiModelConfigEntity>,
  ) {}

  async create(dto: AiModelConfigCreateDto): Promise<AiModelConfigEntity> {
    const entity = this.repo.create({
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
      fieldMappings: (dto.fieldMappings ?? {}) as FieldMappingsJson,
      defaultParams: dto.defaultParams ?? {},
      isEnabled: dto.isEnabled ?? true,
      sort: dto.sort ?? 0,
    });

    try {
      return await this.repo.save(entity);
    } catch (error: unknown) {
      const err = error as { code?: string; errno?: number; message?: string };
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        throw new BadRequestException('该 provider 下已存在相同的 modelName');
      }
      throw new BadRequestException(err.message ?? '创建失败');
    }
  }

  async findList(
    dto: AiModelConfigQueryDto,
  ): Promise<PaginationResponse<AiModelConfigEntity>> {
    const qb = this.repo.createQueryBuilder('c');

    if (dto.provider?.trim()) {
      qb.andWhere('c.provider = :p', { p: dto.provider.trim() });
    }
    if (dto.modelName?.trim()) {
      qb.andWhere('LOWER(c.modelName) LIKE LOWER(:mn)', {
        mn: `%${dto.modelName.trim()}%`,
      });
    }
    if (dto.modelType?.trim()) {
      qb.andWhere('c.modelType = :mt', { mt: dto.modelType.trim() });
    }
    if (typeof dto.isEnabled === 'boolean') {
      qb.andWhere('c.isEnabled = :en', { en: dto.isEnabled });
    }

    const [list, total] = await qb
      .orderBy('c.sort', 'ASC')
      .addOrderBy('c.createdAt', 'DESC')
      .skip(dto.skip)
      .take(dto.limit)
      .getManyAndCount();

    return {
      list,
      total,
      currentPage: dto.page,
      totalPages: Math.ceil(total / dto.pageSize) || 0,
    };
  }

  async findById(id: string): Promise<AiModelConfigEntity> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    const doc = await this.repo.findOne({ where: { id: nid } });
    if (!doc) {
      throw new NotFoundException('ai model config not found');
    }
    return doc;
  }

  async deleteById(id: string): Promise<void> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    const existed = await this.repo.findOne({ where: { id: nid } });
    if (!existed) {
      throw new NotFoundException('ai model config not found');
    }
    await this.repo.delete(nid);
  }

  async updateById(
    id: string,
    dto: AiModelConfigUpdateDto,
  ): Promise<AiModelConfigEntity> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }

    const row = await this.repo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('ai model config not found');
    }

    const patch: Partial<AiModelConfigEntity> = {};
    if (isDefined(dto.provider)) patch.provider = String(dto.provider).trim();
    if (isDefined(dto.modelName)) patch.modelName = String(dto.modelName).trim();
    if (isDefined(dto.displayName)) {
      patch.displayName = String(dto.displayName).trim();
    }
    if (isDefined(dto.modelType)) patch.modelType = String(dto.modelType).trim();
    if (isDefined(dto.apiUrl)) patch.apiUrl = String(dto.apiUrl).trim();
    if (isDefined(dto.maxImageCount)) patch.maxImageCount = dto.maxImageCount;
    if (isDefined(dto.supportedAspectRatio)) {
      patch.supportedAspectRatio = dto.supportedAspectRatio;
    }
    if (isDefined(dto.defaultAspectRatio)) {
      patch.defaultAspectRatio = dto.defaultAspectRatio;
    }
    if (isDefined(dto.supportedResolutions)) {
      patch.supportedResolutions = dto.supportedResolutions;
    }
    if (isDefined(dto.defaultResolution)) {
      patch.defaultResolution = dto.defaultResolution;
    }
    if (isDefined(dto.supportedFormats)) {
      patch.supportedFormats = dto.supportedFormats;
    }
    if (isDefined(dto.maxResolution)) patch.maxResolution = dto.maxResolution;
    if (isDefined(dto.fieldMappings)) {
      patch.fieldMappings = dto.fieldMappings as FieldMappingsJson;
    }
    if (isDefined(dto.defaultParams)) patch.defaultParams = dto.defaultParams;
    if (isDefined(dto.isEnabled)) patch.isEnabled = dto.isEnabled;
    if (isDefined(dto.sort)) patch.sort = dto.sort;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('no fields to update');
    }

    Object.assign(row, patch);

    try {
      return await this.repo.save(row);
    } catch (error: unknown) {
      const err = error as { code?: string; errno?: number; message?: string };
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        throw new BadRequestException('该 provider 下已存在相同的 modelName');
      }
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(err.message ?? '更新失败');
    }
  }
}
