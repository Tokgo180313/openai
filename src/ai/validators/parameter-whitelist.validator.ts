import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AiModelParamWhitelist } from 'src/white-list/entities/ai-model-param-whitelist.entity';

@Injectable()
export class ParameterWhitelistValidator {
  constructor(
    @InjectRepository(AiModelParamWhitelist)
    private readonly whitelistRepo: Repository<AiModelParamWhitelist>,
  ) {}

  /**
   * 校验请求体键是否落在模型白名单内（仅校验顶层键，子路径由业务层递归）。
   */
  async validatePayloadKeys(modelId: number, payload: Record<string, unknown>): Promise<void> {
    const rows = await this.whitelistRepo.find({
      where: { modelId, enabled: 1, parentId: IsNull() },
      select: ['paramKey', 'apiParamKey'],
    });
    if (rows.length === 0) return;

    const allowed = new Set(
      rows.flatMap((r) => [r.paramKey, r.apiParamKey].filter(Boolean)),
    );
    const unknown = Object.keys(payload).filter((k) => !allowed.has(k));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `参数未在白名单中: ${unknown.join(', ')}`,
      );
    }
  }
}
