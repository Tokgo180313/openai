import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { positiveInt } from 'src/common/dto/pagination-int.util';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';
import { PaginationResponse } from 'src/interfaces/pagination.interface';
import { AiModel } from 'src/ai-models/entities/ai-model.entity';
import {
  AiModelParamWhitelist,
  CONTAINER_PARAM_TYPES,
} from './entities/ai-model-param-whitelist.entity';
import {
  ParamWhitelistCreateDto,
  ParamWhitelistQueryDto,
  ParamWhitelistUpdateDto,
} from './dto/param-whitelist.dto';
import {
  assertParentAllowsChild,
  buildApiParamPath,
  buildParamPath,
  buildWhitelistTree,
  isContainerParamType,
  type WhitelistTreeNode,
} from './utils/param-path.util';

function rowErrorMessage(error: unknown): string {
  if (error == null) return '操作失败';
  if (typeof error === 'string') return error;
  const e = error as { code?: string; errno?: number; message?: string };
  if (e.code === 'ER_DUP_ENTRY' || e.errno === 1062) {
    return '该模型下已存在相同的 paramPath';
  }
  if (typeof e.message === 'string') return e.message;
  return '操作失败';
}

@Injectable()
export class ParamWhitelistService {
  constructor(
    @InjectRepository(AiModelParamWhitelist)
    private readonly whitelistRepo: Repository<AiModelParamWhitelist>,
    @InjectRepository(AiModel)
    private readonly aiModelRepo: Repository<AiModel>,
  ) {}

  async create(dto: ParamWhitelistCreateDto): Promise<AiModelParamWhitelist> {
    const modelId = this.parseModelId(dto.modelId);
    await this.assertModelExists(modelId);

    const paramKey = String(dto.paramKey).trim();
    const apiParamKey = String(dto.apiParamKey).trim();
    const paramType = String(dto.paramType).trim();
    if (!paramKey || !apiParamKey) {
      throw new BadRequestException('paramKey 与 apiParamKey 必填');
    }

    this.validateParamTypeRules(paramType, dto.itemParamType, dto.enumValues);

    const parentId = this.parseParentIdInput(dto.parentId);
    const parent = await this.resolveParent(modelId, parentId, undefined);
    assertParentAllowsChild(parent, paramType);

    const paramPath = buildParamPath(parent?.paramPath ?? null, paramKey, paramType);
    const apiParamPath = buildApiParamPath(
      parent?.apiParamPath ?? null,
      apiParamKey,
      paramType,
    );

    const entity = this.whitelistRepo.create({
      modelId,
      parentId: parent?.id ?? null,
      paramPath,
      paramKey,
      apiParamKey,
      apiParamPath,
      paramType,
      itemParamType:
        paramType === 'array' ? String(dto.itemParamType).trim() : null,
      required: dto.required ?? 0,
      defaultValue: isContainerParamType(paramType)
        ? null
        : (dto.defaultValue ?? null),
      minValue: isContainerParamType(paramType) ? null : (dto.minValue ?? null),
      maxValue: isContainerParamType(paramType) ? null : (dto.maxValue ?? null),
      enumValues: this.resolveEnumValues(paramType, dto.itemParamType, dto.enumValues),
      enabled: dto.enabled ?? 1,
      sort: dto.sort ?? 0,
      remark: dto.remark?.trim() || null,
    });

    try {
      return await this.whitelistRepo.save(entity);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(rowErrorMessage(error));
    }
  }

  async findList(
    dto: ParamWhitelistQueryDto,
  ): Promise<PaginationResponse<AiModelParamWhitelist>> {
    const qb = this.whitelistRepo.createQueryBuilder('w');

    if (dto.modelId?.trim()) {
      const mid = parsePositiveIntId(dto.modelId);
      if (mid == null) {
        throw new BadRequestException('无效 modelId');
      }
      qb.andWhere('w.modelId = :modelId', { modelId: mid });
    }
    if (dto.parentId !== undefined && dto.parentId !== '') {
      if (dto.parentId === 'null' || dto.parentId === '0') {
        qb.andWhere('w.parentId IS NULL');
      } else {
        const pid = parsePositiveIntId(dto.parentId);
        if (pid == null) {
          throw new BadRequestException('无效 parentId');
        }
        qb.andWhere('w.parentId = :parentId', { parentId: pid });
      }
    }
    if (dto.paramKey?.trim()) {
      qb.andWhere('w.paramKey LIKE :paramKey', {
        paramKey: `%${dto.paramKey.trim()}%`,
      });
    }
    if (dto.paramPath?.trim()) {
      qb.andWhere('w.paramPath LIKE :paramPath', {
        paramPath: `%${dto.paramPath.trim()}%`,
      });
    }
    if (dto.paramType?.trim()) {
      qb.andWhere('w.paramType = :paramType', {
        paramType: dto.paramType.trim(),
      });
    }
    if (dto.enabled !== undefined && dto.enabled !== '') {
      qb.andWhere('w.enabled = :enabled', { enabled: Number(dto.enabled) });
    }

    qb.orderBy('w.sort', 'ASC').addOrderBy('w.id', 'ASC');

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

  async findByModelId(modelId: string): Promise<AiModelParamWhitelist[]> {
    const mid = parsePositiveIntId(modelId);
    if (mid == null) {
      throw new BadRequestException('无效 modelId');
    }
    return await this.whitelistRepo.find({
      where: { modelId: mid },
      order: { sort: 'ASC', id: 'ASC' },
    });
  }

  async findTreeByModelId(modelId: string): Promise<WhitelistTreeNode[]> {
    const rows = await this.findByModelId(modelId);
    return buildWhitelistTree(rows);
  }

  async findEnabledByModelId(modelId: string): Promise<AiModelParamWhitelist[]> {
    const mid = parsePositiveIntId(modelId);
    if (mid == null) {
      return [];
    }
    return await this.whitelistRepo.find({
      where: { modelId: mid, enabled: 1 },
      order: { sort: 'ASC', id: 'ASC' },
    });
  }

  async findEnabledTreeByModelId(modelId: string): Promise<WhitelistTreeNode[]> {
    const rows = await this.findEnabledByModelId(modelId);
    return buildWhitelistTree(rows);
  }

  async findById(id: string): Promise<AiModelParamWhitelist | null> {
    const nid = parsePositiveIntId(id);
    if (nid == null) return null;
    return await this.whitelistRepo.findOne({ where: { id: nid } });
  }

  async update(dto: ParamWhitelistUpdateDto): Promise<AiModelParamWhitelist> {
    const nid = parsePositiveIntId(dto.id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }

    const row = await this.whitelistRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('param whitelist not found');
    }

    const touched =
      dto.modelId !== undefined ||
      dto.parentId !== undefined ||
      dto.paramKey !== undefined ||
      dto.apiParamKey !== undefined ||
      dto.paramType !== undefined ||
      dto.itemParamType !== undefined ||
      dto.required !== undefined ||
      dto.defaultValue !== undefined ||
      dto.minValue !== undefined ||
      dto.maxValue !== undefined ||
      dto.enumValues !== undefined ||
      dto.enabled !== undefined ||
      dto.sort !== undefined ||
      dto.remark !== undefined;

    if (!touched) {
      throw new BadRequestException('至少提供一项待更新字段');
    }

    const nextModelId =
      dto.modelId !== undefined ? this.parseModelId(dto.modelId) : row.modelId;
    if (dto.modelId !== undefined) {
      await this.assertModelExists(nextModelId);
      row.modelId = nextModelId;
    }

    const nextParamType =
      dto.paramType !== undefined
        ? String(dto.paramType).trim()
        : row.paramType;
    const nextItemParamType =
      dto.itemParamType !== undefined
        ? dto.itemParamType
        : row.itemParamType;

    this.validateParamTypeRules(
      nextParamType,
      nextItemParamType ?? undefined,
      dto.enumValues ?? row.enumValues ?? undefined,
    );

    let nextParentId = row.parentId;
    if (dto.parentId !== undefined) {
      nextParentId = this.parseParentIdInput(dto.parentId);
      if (nextParentId === row.id) {
        throw new BadRequestException('parentId 不能指向自身');
      }
    }

    const parent = await this.resolveParent(
      nextModelId,
      nextParentId,
      row.id,
    );
    assertParentAllowsChild(parent, nextParamType);

    if (parent && (await this.isDescendant(row.id, parent.id))) {
      throw new BadRequestException('不能将参数移动到其子孙节点下');
    }

    const nextParamKey =
      dto.paramKey !== undefined
        ? String(dto.paramKey).trim()
        : row.paramKey;
    const nextApiParamKey =
      dto.apiParamKey !== undefined
        ? String(dto.apiParamKey).trim()
        : row.apiParamKey;

    if (!nextParamKey || !nextApiParamKey) {
      throw new BadRequestException('paramKey 与 apiParamKey 不能为空');
    }

    const pathChanged =
      dto.parentId !== undefined ||
      dto.paramKey !== undefined ||
      dto.paramType !== undefined ||
      dto.modelId !== undefined;

    row.parentId = parent?.id ?? null;
    row.paramKey = nextParamKey;
    row.apiParamKey = nextApiParamKey;
    row.paramType = nextParamType;
    row.itemParamType =
      nextParamType === 'array'
        ? String(nextItemParamType ?? '').trim() || null
        : null;

    if (pathChanged) {
      row.paramPath = buildParamPath(
        parent?.paramPath ?? null,
        nextParamKey,
        nextParamType,
      );
      row.apiParamPath = buildApiParamPath(
        parent?.apiParamPath ?? null,
        nextApiParamKey,
        nextParamType,
      );
    } else if (dto.apiParamKey !== undefined) {
      row.apiParamPath = buildApiParamPath(
        parent?.apiParamPath ?? null,
        nextApiParamKey,
        nextParamType,
      );
    }

    if (dto.required !== undefined) row.required = dto.required;
    if (dto.defaultValue !== undefined && !isContainerParamType(nextParamType)) {
      row.defaultValue = dto.defaultValue;
    }
    if (dto.minValue !== undefined && !isContainerParamType(nextParamType)) {
      row.minValue = dto.minValue;
    }
    if (dto.maxValue !== undefined && !isContainerParamType(nextParamType)) {
      row.maxValue = dto.maxValue;
    }
    if (dto.enumValues !== undefined) {
      row.enumValues = this.resolveEnumValues(
        nextParamType,
        nextItemParamType ?? undefined,
        dto.enumValues ?? undefined,
      );
    }
    if (isContainerParamType(nextParamType)) {
      row.defaultValue = null;
      row.minValue = null;
      row.maxValue = null;
      row.enumValues = null;
      row.itemParamType = null;
    }
    if (dto.enabled !== undefined) row.enabled = dto.enabled;
    if (dto.sort !== undefined) row.sort = dto.sort;
    if (dto.remark !== undefined) row.remark = dto.remark;

    try {
      const saved = await this.whitelistRepo.save(row);
      if (pathChanged) {
        await this.rebuildDescendantPaths(saved);
      }
      return saved;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(rowErrorMessage(error));
    }
  }

  async deleteById(id: string): Promise<{ message: string }> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    const childCnt = await this.whitelistRepo.count({
      where: { parentId: nid },
    });
    if (childCnt > 0) {
      throw new BadRequestException('请先删除子参数，或改用级联删除策略');
    }
    const res = await this.whitelistRepo.delete(nid);
    if (!res.affected) {
      throw new NotFoundException('param whitelist not found');
    }
    return { message: '删除成功' };
  }

  async deleteByIdCascade(id: string): Promise<{ message: string }> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    const row = await this.whitelistRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('param whitelist not found');
    }
    const all = await this.whitelistRepo.find({
      where: { modelId: row.modelId },
    });
    const idsToDelete = this.collectDescendantIds(nid, all);
    await this.whitelistRepo.delete(idsToDelete);
    return { message: '删除成功' };
  }

  async disableById(id: string): Promise<AiModelParamWhitelist> {
    return this.setEnabled(id, 0);
  }

  async enableById(id: string): Promise<AiModelParamWhitelist> {
    return this.setEnabled(id, 1);
  }

  private async rebuildDescendantPaths(root: AiModelParamWhitelist): Promise<void> {
    const all = await this.whitelistRepo.find({
      where: { modelId: root.modelId },
      order: { sort: 'ASC', id: 'ASC' },
    });
    const byParent = new Map<number | null, AiModelParamWhitelist[]>();
    for (const r of all) {
      const key = r.parentId;
      const list = byParent.get(key) ?? [];
      list.push(r);
      byParent.set(key, list);
    }

    const walk = async (node: AiModelParamWhitelist) => {
      const children = byParent.get(node.id) ?? [];
      for (const child of children) {
        child.paramPath = buildParamPath(
          node.paramPath,
          child.paramKey,
          child.paramType,
        );
        child.apiParamPath = buildApiParamPath(
          node.apiParamPath,
          child.apiParamKey,
          child.paramType,
        );
        await this.whitelistRepo.save(child);
        await walk(child);
      }
    };
    await walk(root);
  }

  private collectDescendantIds(
    rootId: number,
    rows: AiModelParamWhitelist[],
  ): number[] {
    const ids = [rootId];
    const children = rows.filter((r) => r.parentId === rootId);
    for (const c of children) {
      ids.push(...this.collectDescendantIds(c.id, rows));
    }
    return ids;
  }

  private async isDescendant(
    ancestorId: number,
    maybeDescendantId: number,
  ): Promise<boolean> {
    let cur = await this.whitelistRepo.findOne({
      where: { id: maybeDescendantId },
    });
    while (cur?.parentId != null) {
      if (cur.parentId === ancestorId) return true;
      cur = await this.whitelistRepo.findOne({ where: { id: cur.parentId } });
    }
    return false;
  }

  private validateParamTypeRules(
    paramType: string,
    itemParamType?: string | null,
    enumValues?: unknown[] | null,
  ): void {
    if (paramType === 'array') {
      if (!itemParamType) {
        throw new BadRequestException('paramType=array 时必须指定 itemParamType');
      }
    } else if (itemParamType) {
      throw new BadRequestException('仅 array 类型可设置 itemParamType');
    }

    if (
      (paramType === 'enum' ||
        (paramType === 'array' && itemParamType === 'enum')) &&
      (!enumValues || enumValues.length === 0)
    ) {
      throw new BadRequestException('enum 类型需提供 enumValues');
    }

    if (
      (CONTAINER_PARAM_TYPES as readonly string[]).includes(paramType) &&
      enumValues?.length
    ) {
      throw new BadRequestException('object / object[] 容器节点不支持 enumValues');
    }
  }

  private resolveEnumValues(
    paramType: string,
    itemParamType: string | undefined | null,
    enumValues?: unknown[] | null,
  ): unknown[] | null {
    if (paramType === 'enum') return enumValues ?? [];
    if (paramType === 'array' && itemParamType === 'enum') {
      return enumValues ?? [];
    }
    return enumValues ?? null;
  }

  private async resolveParent(
    modelId: number,
    parentId: number | null,
    selfId: number | undefined,
  ): Promise<AiModelParamWhitelist | null> {
    if (parentId == null) return null;

    const parent = await this.whitelistRepo.findOne({
      where: { id: parentId, modelId },
    });
    if (!parent) {
      throw new NotFoundException('父参数不存在或不属于该模型');
    }
    if (selfId != null && parent.id === selfId) {
      throw new BadRequestException('parentId 不能指向自身');
    }
    return parent;
  }

  private parseParentIdInput(
    raw: string | null | undefined,
  ): number | null {
    if (raw === undefined || raw === null || raw === '') return null;
    const pid = parsePositiveIntId(raw);
    if (pid == null) {
      throw new BadRequestException('无效 parentId');
    }
    return pid;
  }

  private async setEnabled(
    id: string,
    enabled: number,
  ): Promise<AiModelParamWhitelist> {
    const nid = parsePositiveIntId(id);
    if (nid == null) {
      throw new BadRequestException('无效 id');
    }
    const row = await this.whitelistRepo.findOne({ where: { id: nid } });
    if (!row) {
      throw new NotFoundException('param whitelist not found');
    }
    row.enabled = enabled;
    return await this.whitelistRepo.save(row);
  }

  private parseModelId(raw: string): number {
    const mid = parsePositiveIntId(raw);
    if (mid == null) {
      throw new BadRequestException('无效 modelId');
    }
    return mid;
  }

  private async assertModelExists(modelId: number): Promise<void> {
    const model = await this.aiModelRepo.findOne({ where: { id: modelId } });
    if (!model) {
      throw new NotFoundException(`ai model not found: ${modelId}`);
    }
  }
}
