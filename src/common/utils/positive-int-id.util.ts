/**
 * 将路径/查询参数中的 id 解析为正整数主键（MySQL INT AUTO_INCREMENT）
 */
export function parsePositiveIntId(
  raw: string | undefined | null,
): number | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}
