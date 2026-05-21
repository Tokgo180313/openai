import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { ApiKey } from './entities/api-key.entity';
import { ProviderDto, ProviderQueryDto, ProviderUpdateDto } from './dto/provider.dto';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly providerRepo: Repository<ApiKey>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(dto: ProviderDto): Promise<ApiKey> {
    if (!dto?.apiKey || !dto?.provider) {
      throw new BadRequestException('apiKey 与 provider 必填');
    }

    const provider = ProviderService.normalizeProvider(dto.provider);
    const entity = this.providerRepo.create({
      provider,
      apiKey: this.encryptionService.encrypt(dto.apiKey),
      baseURL: dto.baseURL ?? '',
    });
    return await this.providerRepo.save(entity);
  }

  async findProviderList(dto: ProviderQueryDto): Promise<ApiKey[]> {
    const qb = this.providerRepo.createQueryBuilder('k');
    if (dto?.provider) {
      const p = ProviderService.normalizeProvider(dto.provider);
      qb.andWhere('LOWER(k.provider) = :p', { p });
    }
    if (dto?.baseURL) {
      qb.andWhere('k.baseURL = :b', { b: dto.baseURL });
    }
    return qb.orderBy('k.updatedAt', 'DESC').getMany();
  }

  async findById(id: string): Promise<ApiKey | null> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      return null;
    }
    return await this.providerRepo.findOne({ where: { id: nid } });
  }

  async deleteById(id: string): Promise<void> {
    const existed = await this.findById(id);
    if (!existed) {
      throw new NotFoundException('provider record not found');
    }
    await this.providerRepo.delete(existed.id);
  }

  async updateById(id: string, dto: ProviderUpdateDto): Promise<ApiKey | null> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('invalid id');
    }
    const row = await this.providerRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('provider record not found');
    }

    if (dto?.provider !== undefined) {
      row.provider = ProviderService.normalizeProvider(dto.provider);
    }
    if (dto?.baseURL !== undefined) {
      row.baseURL = dto.baseURL;
    }
    if (dto?.apiKey) {
      row.apiKey = this.encryptionService.encrypt(dto.apiKey);
    }

    const touched =
      dto?.provider !== undefined || dto?.baseURL !== undefined || !!dto?.apiKey;
    if (!touched) {
      throw new BadRequestException('no fields to update');
    }

    return await this.providerRepo.save(row);
  }

  /**
   * 根据 provider 查单条；若存在多条则取最近更新的一条。
   * provider 不区分大小写。
   */
  async findByProvider(provider: string): Promise<ApiKey | null> {
    const normalized = ProviderService.normalizeProvider(provider);
    if (!normalized) {
      throw new BadRequestException('provider is required');
    }
    return await this.providerRepo
      .createQueryBuilder('k')
      .where('LOWER(k.provider) = :p', { p: normalized })
      .orderBy('k.updatedAt', 'DESC')
      .getOne();
  }

  private static normalizeProvider(raw: string): string {
    return String(raw ?? '').trim().toLowerCase();
  }
}
