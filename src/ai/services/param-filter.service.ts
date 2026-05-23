import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModelParamWhitelist } from 'src/white-list/entities/ai-model-param-whitelist.entity';
import {
  buildWhitelistTree,
  isContainerParamType,
  type WhitelistTreeNode,
} from 'src/white-list/utils/param-path.util';

@Injectable()
export class ParamFilterService {
  constructor(
    @InjectRepository(AiModelParamWhitelist)
    private readonly whitelistRepo: Repository<AiModelParamWhitelist>,
  ) {}

  /** 按模型白名单树过滤并映射为上游 api 字段名 */
  async filter(
    modelId: number,
    params: Record<string, unknown> | undefined,
  ): Promise<Record<string, unknown>> {
    if (!params || Object.keys(params).length === 0) {
      return {};
    }
    const rows = await this.whitelistRepo.find({
      where: { modelId, enabled: 1 },
    });
    if (rows.length === 0) {
      return { ...params };
    }
    const tree = buildWhitelistTree(rows);
    return this.pickByTree(params, tree);
  }

  private pickByTree(
    source: Record<string, unknown>,
    nodes: WhitelistTreeNode[],
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const node of nodes) {
      const srcKey = node.paramKey;
      const outKey = node.apiParamKey || node.paramKey;
      if (!Object.prototype.hasOwnProperty.call(source, srcKey)) {
        continue;
      }
      const raw = source[srcKey];
      if (raw === undefined) continue;

      if (isContainerParamType(node.paramType)) {
        if (node.paramType === 'object' && raw && typeof raw === 'object') {
          const nested = this.pickByTree(
            raw as Record<string, unknown>,
            node.children,
          );
          if (Object.keys(nested).length > 0) {
            out[outKey] = nested;
          }
          continue;
        }
        if (node.paramType === 'object[]' && Array.isArray(raw)) {
          const mapped = raw
            .map((item) =>
              item && typeof item === 'object'
                ? this.pickByTree(item as Record<string, unknown>, node.children)
                : null,
            )
            .filter((item) => item && Object.keys(item).length > 0);
          if (mapped.length > 0) {
            out[outKey] = mapped;
          }
          continue;
        }
      }

      out[outKey] = raw;
    }
    return out;
  }
}
