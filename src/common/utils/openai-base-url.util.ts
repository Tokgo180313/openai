/** OpenAI SDK 会在 baseURL 后拼接具体路径；若已含 `/chat/completions` 等子路径需剥掉。 */
export function normalizeOpenAIBaseURL(raw: string | undefined): string | undefined {
  if (raw == null || typeof raw !== 'string') return undefined;
  let u = raw.trim();
  if (!u) return undefined;
  while (/\/chat\/completions\/?$/i.test(u)) {
    u = u.replace(/\/chat\/completions\/?$/i, '');
  }
  u = u.replace(/\/+$/, '');
  return u || undefined;
}

export const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';
