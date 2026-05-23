import { BadRequestException } from '@nestjs/common';
import type { AiModelParamWhitelist } from '../entities/ai-model-param-whitelist.entity';
import { CONTAINER_PARAM_TYPES } from '../entities/ai-model-param-whitelist.entity';

const SEGMENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export type WhitelistTreeNode = AiModelParamWhitelist & {
  children: WhitelistTreeNode[];
};

/** 由父路径与当前段生成系统内全路径 */
export function buildParamPath(
  parentPath: string | null,
  paramKey: string,
  paramType: string,
): string {
  const key = String(paramKey ?? '').trim();
  if (!key || !SEGMENT_RE.test(key)) {
    throw new BadRequestException(
      'paramKey 仅允许字母、数字、下划线，且不能以数字开头',
    );
  }

  const parent = String(parentPath ?? '').trim();
  if (!parent) {
    return paramType === 'object[]' ? `${key}[]` : key;
  }

  if (parent.endsWith('[]')) {
    return `${parent}.${key}`;
  }
  if (paramType === 'object[]') {
    return `${parent}.${key}[]`;
  }
  return `${parent}.${key}`;
}

/** 由父 API 路径与当前段生成上游字段全路径 */
export function buildApiParamPath(
  parentApiPath: string | null,
  apiParamKey: string,
  paramType: string,
): string {
  const key = String(apiParamKey ?? '').trim();
  if (!key) {
    throw new BadRequestException('apiParamKey 不能为空');
  }

  const parent = String(parentApiPath ?? '').trim();
  if (!parent) {
    return paramType === 'object[]' ? `${key}[]` : key;
  }

  if (parent.endsWith('[]')) {
    return `${parent}.${key}`;
  }
  if (paramType === 'object[]') {
    return `${parent}.${key}[]`;
  }
  return `${parent}.${key}`;
}

export function isContainerParamType(paramType: string): boolean {
  return (CONTAINER_PARAM_TYPES as readonly string[]).includes(paramType);
}

export function assertParentAllowsChild(
  parent: AiModelParamWhitelist | null,
  childParamType: string,
): void {
  if (!parent) return;

  if (!isContainerParamType(parent.paramType)) {
    throw new BadRequestException(
      `父参数「${parent.paramKey}」类型为 ${parent.paramType}，不能挂载子参数`,
    );
  }

  if (parent.paramType === 'object[]' && childParamType === 'object[]') {
    throw new BadRequestException(
      'object[] 元素内不能再嵌套 object[]，请用 object 作为中间层',
    );
  }
}

export function buildWhitelistTree(
  rows: AiModelParamWhitelist[],
): WhitelistTreeNode[] {
  const byId = new Map<number, WhitelistTreeNode>();
  const roots: WhitelistTreeNode[] = [];

  for (const row of rows) {
    byId.set(row.id, { ...row, children: [] });
  }

  for (const node of byId.values()) {
    if (node.parentId == null) {
      roots.push(node);
      continue;
    }
    const parent = byId.get(node.parentId);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: WhitelistTreeNode[]) => {
    nodes.sort((a, b) => a.sort - b.sort || a.id - b.id);
    for (const n of nodes) {
      if (n.children.length) sortNodes(n.children);
    }
  };
  sortNodes(roots);
  return roots;
}
