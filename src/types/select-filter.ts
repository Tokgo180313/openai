import type { DefaultOptionType } from "ant-design-vue/es/select";

export function filterSelectOption(
  input: string,
  option?: DefaultOptionType,
): boolean {
  const label = String(option?.label ?? "");
  return label.toLowerCase().includes(input.trim().toLowerCase());
}
