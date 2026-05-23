export class AiResponseDto {
  /** 统一成功标识 */
  success = true;

  /** 模型原始或归一化后的响应体 */
  data: unknown;

  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}
