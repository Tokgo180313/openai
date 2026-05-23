/** 流结束后由 OpenAI 流式接口写入的 usage（若网关支持） */
export type StreamCompletionUsageOut = {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};
