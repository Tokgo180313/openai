/** 下拉选项与分辨率映射（按后端 / 模型约定调整） */

import api from "@/api/apiList";

export type SelectOption = { label: string; value: string };

/** 宽高比字符串统一为半角冒号，与配置页、接口一致 */
export function normalizeAspectRatioToken(raw: string) {
  return raw.replace(/\uFF1A/g, ":").trim();
}

/** 单个模型下拉项 + 该模型支持的比例、分辨率（来自接口） */
export type ModelOption = {
  label: string;
  value: string;
  /** 服务商，与 AI 模型配置一致 */
  provider?: string;
  supportedAspectRatio: string[];
  supportedResolutions: string[];
  /** 配置中的默认宽高比，用于切换模型时回填 */
  defaultAspectRatio?: string;
  /** 配置中的默认分辨率档位 */
  defaultResolution?: string;
};

function normalizeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => String(x ?? "").trim())
    .filter((s) => s.length > 0);
}

/** 从 AI 模型配置列表生成下拉项：label = displayName，value = modelName（仅启用），并带回 supportedAspectRatio、supportedResolutions */
export async function fetchImageModelOptions(): Promise<ModelOption[]> {
  const res = (await api.findAiModelConfigListInterface({
    page: 1,
    pageSize: 500,
    isEnabled: true,
  })) as {
    code?: number;
    data?: { list?: unknown[]; total?: number };
    message?: string;
  };

  const ok = res?.code === 200 || res?.code === 201;
  if (!ok) {
    return [];
  }

  const data = res?.data as { list?: unknown[] } | unknown[] | undefined;
  const rawList = Array.isArray(data)
    ? data
    : data && Array.isArray(data.list)
      ? data.list
      : [];
  const list = rawList;

  const rows = list
    .map((row: any) => ({
      displayName: row?.displayName,
      modelName: row?.modelName,
      provider: row?.provider != null ? String(row.provider).trim() : "",
      sort: typeof row?.sort === "number" ? row.sort : 0,
      supportedAspectRatio: normalizeStringArray(row?.supportedAspectRatio).map((s) =>
        normalizeAspectRatioToken(s),
      ),
      supportedResolutions: normalizeStringArray(row?.supportedResolutions),
      defaultAspectRatio: row?.defaultAspectRatio
        ? normalizeAspectRatioToken(String(row.defaultAspectRatio))
        : undefined,
      defaultResolution: row?.defaultResolution
        ? String(row.defaultResolution).trim()
        : undefined,
    }))
    .filter(
      (row) =>
        row.modelName != null &&
        String(row.modelName).trim().length > 0 &&
        row.displayName != null &&
        String(row.displayName).trim().length > 0,
    );

  rows.sort((a, b) => a.sort - b.sort);

  return rows.map((row) => ({
    label: String(row.displayName).trim(),
    value: String(row.modelName).trim(),
    provider: row.provider || undefined,
    supportedAspectRatio: row.supportedAspectRatio,
    supportedResolutions: row.supportedResolutions,
    defaultAspectRatio: row.defaultAspectRatio?.trim() || undefined,
    defaultResolution: row.defaultResolution?.trim() || undefined,
  }));
}

export const ratioOptions = [
  { label: "智能 / 默认", value: "3.4" },
  { label: "21:9", value: "21:9" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "1:1", value: "1:1" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
];

export const sizeOptions = [
  { label: "2K", value: "2K" },
  { label: "3K", value: "3K" },
  { label: "4K", value: "4K" },
];

/** 接口返回的比例字符串 → 下拉项（label 优先匹配本地 ratioOptions 展示名） */
export function mapAspectStringsToOptions(values: string[]): SelectOption[] {
  return values.map((v) => {
    const hit = ratioOptions.find((o) => o.value === v);
    return { label: hit?.label ?? v, value: v };
  });
}

/** 接口返回的分辨率字符串 → 下拉项 */
export function mapResolutionStringsToOptions(values: string[]): SelectOption[] {
  return values.map((v) => {
    const hit = sizeOptions.find((o) => o.value === v);
    return { label: hit?.label ?? v, value: v };
  });
}

/** imageSize -> imageRatio -> WxH */
export const recommendedSizeMap: Record<string, Record<string, string>> = {
  "2K": {
    "21:9": "3024x1296",
    "16:9": "2560x1440",
    "9:16": "1440x2560",
    "4:3": "2304x1728",
    "3:4": "1728x2304",
    "3.4": "1728x2304",
    "1:1": "2048x2048",
    "3:2": "2496x1664",
    "2:3": "1664x2496",
  },
  "3K": {
    "21:9": "3840x1728",
    "16:9": "3840x2160",
    "9:16": "2160x3840",
    "4:3": "3072x2304",
    "3:4": "2304x3072",
    "3.4": "2304x3072",
    "1:1": "3072x3072",
    "3:2": "3072x2048",
    "2:3": "2048x3072",
  },
  "4K": {
    "21:9": "6198x2656",
    "16:9": "5404x3040",
    "9:16": "3040x5404",
    "4:3": "4694x3520",
    "3:4": "3520x4694",
    "3.4": "3520x4694",
    "1:1": "4096x4096",
    "3:2": "4992x3328",
    "2:3": "3328x4992",
  },
};

/** 忽略 imageSize 大小写匹配推荐 WxH */
export function lookupRecommendedSize(imageSize: string, ratio: string): string | undefined {
  const raw = (imageSize ?? "").toString().trim();
  const ratioRaw = (ratio ?? "").toString().trim();
  const keys = ["2K", "3K", "4K"] as const;
  const norm = keys.find((k) => k.toLowerCase() === raw.toLowerCase()) ?? raw;
  return recommendedSizeMap[norm]?.[ratioRaw];
}
