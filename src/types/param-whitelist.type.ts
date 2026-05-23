/** 叶子类型 */
export const LEAF_PARAM_TYPES = [
  "number",
  "string",
  "boolean",
  "enum",
  "array",
] as const;

/** 容器类型：可挂子参数 */
export const CONTAINER_PARAM_TYPES = ["object", "object[]"] as const;

export const PARAM_TYPES = [
  ...LEAF_PARAM_TYPES,
  ...CONTAINER_PARAM_TYPES,
] as const;

export type ParamType = (typeof PARAM_TYPES)[number];
export type LeafParamType = (typeof LEAF_PARAM_TYPES)[number];
export type ContainerParamType = (typeof CONTAINER_PARAM_TYPES)[number];

/** array 时元素类型：叶子或可容纳子参数的复杂类型 */
export const ARRAY_ITEM_LEAF_PARAM_TYPES = [
  "number",
  "string",
  "boolean",
  "enum",
] as const;

/** 数组元素为 object / object[] / array 时，其下可继续挂子参数描述元素结构 */
export const ARRAY_ITEM_COMPLEX_PARAM_TYPES = [
  "object",
  "object[]",
  "array",
] as const;

export const ARRAY_ITEM_PARAM_TYPES = [
  ...ARRAY_ITEM_LEAF_PARAM_TYPES,
  ...ARRAY_ITEM_COMPLEX_PARAM_TYPES,
] as const;

export type ArrayItemParamType = (typeof ARRAY_ITEM_PARAM_TYPES)[number];

export const PARAM_TYPE_LABEL_MAP: Record<string, string> = {
  number: "数字",
  string: "字符串",
  boolean: "布尔",
  enum: "枚举",
  array: "数组",
  object: "对象",
  "object[]": "对象数组",
};

export const ARRAY_ITEM_PARAM_TYPE_LABEL_MAP: Record<string, string> = {
  number: "数字",
  string: "字符串",
  boolean: "布尔",
  enum: "枚举",
  object: "对象",
  "object[]": "对象数组",
  array: "数组",
};

export function getParamTypeLabel(paramType?: string): string {
  if (!paramType) return "-";
  return PARAM_TYPE_LABEL_MAP[paramType] ?? paramType;
}

export function getArrayItemParamTypeLabel(itemParamType?: string): string {
  if (!itemParamType) return "-";
  return ARRAY_ITEM_PARAM_TYPE_LABEL_MAP[itemParamType] ?? itemParamType;
}

export function isComplexArrayItemType(itemParamType?: string | null): boolean {
  return (ARRAY_ITEM_COMPLEX_PARAM_TYPES as readonly string[]).includes(
    itemParamType ?? "",
  );
}

/** 是否可挂子参数：object / object[]，或元素为复杂类型的 array */
export function isContainerParamType(
  paramType?: string,
  itemParamType?: string | null,
): boolean {
  if ((CONTAINER_PARAM_TYPES as readonly string[]).includes(paramType ?? "")) {
    return true;
  }
  return paramType === "array" && isComplexArrayItemType(itemParamType);
}

export function needsItemParamType(paramType?: string): boolean {
  return paramType === "array";
}

export function needsEnumValues(
  paramType?: string,
  itemParamType?: string | null,
): boolean {
  return (
    paramType === "enum" ||
    (paramType === "array" && itemParamType === "enum")
  );
}

export function needsMinMax(
  paramType?: string,
  itemParamType?: string | null,
): boolean {
  return (
    paramType === "number" ||
    (paramType === "array" && itemParamType === "number")
  );
}

/** 参数白名单节点 */
export interface ParamWhitelistItem {
  id: string;
  modelId: string;
  parentId?: string | null;
  paramPath: string;
  paramKey: string;
  apiParamKey: string;
  apiParamPath: string;
  paramType: ParamType | string;
  itemParamType?: string | null;
  required?: number | string;
  defaultValue?: unknown | null;
  minValue?: string | null;
  maxValue?: string | null;
  enumValues?: unknown[] | null;
  enabled?: number | string;
  sort?: number;
  remark?: string | null;
  children?: WhitelistTreeNode[];
  [key: string]: unknown;
}

export type WhitelistTreeNode = ParamWhitelistItem & {
  children: WhitelistTreeNode[];
};

export function buildWhitelistTree(rows: ParamWhitelistItem[]): WhitelistTreeNode[] {
  const byId = new Map<string, WhitelistTreeNode>();

  for (const row of rows) {
    byId.set(String(row.id), { ...row, children: [] });
  }

  const roots: WhitelistTreeNode[] = [];
  for (const node of byId.values()) {
    const parentId = node.parentId;
    if (parentId == null || parentId === "") {
      roots.push(node);
      continue;
    }
    const parent = byId.get(String(parentId));
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: WhitelistTreeNode[]) => {
    nodes.sort(
      (a, b) =>
        Number(a.sort ?? 0) - Number(b.sort ?? 0) ||
        Number(a.id) - Number(b.id),
    );
    for (const n of nodes) {
      if (n.children.length) sortNodes(n.children);
    }
  };
  sortNodes(roots);
  return roots;
}

/** 若接口已返回树形 children，则直接使用；否则由扁平列表构建 */
export function normalizeWhitelistTree(
  data: ParamWhitelistItem[] | WhitelistTreeNode[],
): WhitelistTreeNode[] {
  if (!data?.length) return [];
  const hasNested = data.some(
    (row) => Array.isArray(row.children) && row.children.length > 0,
  );
  if (hasNested) {
    return data as WhitelistTreeNode[];
  }
  return buildWhitelistTree(data);
}

/** 收集所有容器节点，用于选择父参数 */
export function collectContainerNodes(
  nodes: WhitelistTreeNode[],
  modelId?: string,
): WhitelistTreeNode[] {
  const result: WhitelistTreeNode[] = [];
  const walk = (list: WhitelistTreeNode[]) => {
    for (const node of list) {
      if (modelId && String(node.modelId) !== String(modelId)) continue;
      if (isContainerParamType(node.paramType, node.itemParamType)) {
        result.push(node);
      }
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

export function formatDefaultValue(value: unknown): string {
  if (value === undefined || value === null) return "-";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function stringifyJsonField(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function parseOptionalJson(value: string): unknown | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  return JSON.parse(raw) as unknown;
}

export function parseOptionalJsonArray(value: string): unknown[] | undefined {
  const parsed = parseOptionalJson(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) {
    throw new Error("请输入 JSON 数组");
  }
  return parsed;
}
