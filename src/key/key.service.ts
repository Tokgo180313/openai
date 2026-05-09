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
import { KeyDto, KeyQueryDto, KeyUpdateDto } from './dto/key.dto';

@Injectable()
export class KeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly keyRepo: Repository<ApiKey>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async createKey(dto: KeyDto): Promise<ApiKey> {
    if (!dto?.apiKey || !dto?.modelClassify) {
      throw new BadRequestException('apiKey 与 modelClassify 必填');
    }

    const modelClassify = KeyService.normalizeModelClassify(dto.modelClassify);
    const entity = this.keyRepo.create({
      modelClassify,
      apiKey: this.encryptionService.encrypt(dto.apiKey),
      baseURL: dto.baseURL ?? '',
    });
    return await this.keyRepo.save(entity);
  }

  async findKeyList(dto: KeyQueryDto): Promise<ApiKey[]> {
    const qb = this.keyRepo.createQueryBuilder('k');
    if (dto?.modelClassify) {
      const c = KeyService.normalizeModelClassify(dto.modelClassify);
      qb.andWhere('LOWER(k.modelClassify) = :c', { c });
    }
    if (dto?.baseURL) {
      qb.andWhere('k.baseURL = :b', { b: dto.baseURL });
    }
    return qb.orderBy('k.updatedAt', 'DESC').getMany();
  }

  async findKeyById(id: string): Promise<ApiKey | null> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      return null;
    }
    return await this.keyRepo.findOne({ where: { id: nid } });
  }

  async deleteKeyById(id: string): Promise<void> {
    const existed = await this.findKeyById(id);
    if (!existed) {
      throw new NotFoundException('key not found');
    }
    await this.keyRepo.delete(existed.id);
  }

  async updateKeyById(id: string, dto: KeyUpdateDto): Promise<ApiKey | null> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('invalid id');
    }
    const row = await this.keyRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('key not found');
    }

    if (dto?.modelClassify !== undefined) {
      row.modelClassify = KeyService.normalizeModelClassify(dto.modelClassify);
    }
    if (dto?.baseURL !== undefined) {
      row.baseURL = dto.baseURL;
    }
    if (dto?.apiKey) {
      row.apiKey = this.encryptionService.encrypt(dto.apiKey);
    }

    const touched =
      dto?.modelClassify !== undefined ||
      dto?.baseURL !== undefined ||
      !!dto?.apiKey;
    if (!touched) {
      throw new BadRequestException('no fields to update');
    }

    return await this.keyRepo.save(row);
  }

  /**
   * 根据 modelClassify 查单条；若存在多条则取最近更新的一条。
   * modelClassify 不区分大小写。
   */
  async findKeyByModelClassify(modelClassify: string): Promise<ApiKey | null> {
    const classify = KeyService.normalizeModelClassify(modelClassify);
    if (!classify) {
      throw new BadRequestException('modelClassify is required');
    }
    return await this.keyRepo
      .createQueryBuilder('k')
      .where('LOWER(k.modelClassify) = :c', { c: classify })
      .orderBy('k.updatedAt', 'DESC')
      .getOne();
  }

  private static normalizeModelClassify(raw: string): string {
    return String(raw ?? '').trim().toLowerCase();
  }
}
