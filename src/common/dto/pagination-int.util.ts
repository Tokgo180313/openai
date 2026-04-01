/** 用于 class-transformer：把分页参数转成 ≥1 的整数，缺省或非法时用 fallback */
export function positiveInt(value: unknown, fallback: number): number {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}
