/** 兼容后端返回数组或 { list, total, hasMore } 结构 */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && typeof data === "object" && "list" in data) {
    return ((data as { list?: T[] }).list ?? []) as T[];
  }
  return [];
}

export function unwrapPagedMeta(data: unknown): {
  total?: number;
  hasMore?: boolean;
} {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as { total?: number; hasMore?: boolean };
    return { total: obj.total, hasMore: obj.hasMore };
  }
  return {};
}
