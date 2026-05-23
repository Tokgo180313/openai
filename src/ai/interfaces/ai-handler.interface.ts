import type { AiRequestDto } from '../dto/ai-request.dto';
import type { AiResponseDto } from '../dto/ai-response.dto';

export interface AiHandlerContext {
  userId: string;
  provider: string;
  modelType: string;
  /** 非流式 ChatGPT 落库需要 JWT */
  token?: string;
}

export interface AiHandler {
  /** 是否支持当前 modelType */
  supports(modelType: string): boolean;
  handle(
    request: AiRequestDto,
    context: AiHandlerContext,
  ): Promise<AiResponseDto>;
}
