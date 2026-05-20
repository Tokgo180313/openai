/** 从 linkfox 图片接口响应中提取 http(s) 或 data URL */
export function extractImageUrlsFromLinkfoxResponse(
  payload: unknown,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (u: unknown) => {
    const s = String(u ?? '').trim();
    if (!s || seen.has(s)) return;
    if (
      s.startsWith('http://') ||
      s.startsWith('https://') ||
      s.startsWith('data:image')
    ) {
      seen.add(s);
      out.push(s);
    }
  };

  const walk = (node: unknown, depth: number) => {
    if (node == null || depth > 8) return;
    if (typeof node === 'string') {
      push(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node === 'object') {
      const o = node as Record<string, unknown>;
      for (const key of [
        'url',
        'imageUrl',
        'image_url',
        'resultUrl',
        'outputUrl',
      ]) {
        if (key in o) push(o[key]);
      }
      for (const v of Object.values(o)) walk(v, depth + 1);
    }
  };

  walk(payload, 0);
  return out;
}
