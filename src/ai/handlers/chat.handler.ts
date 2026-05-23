import { Injectable } from '@nestjs/common';
import { ModelType } from '../enums/model-type.enum';
import type { AiRequestDto } from '../dto/ai-request.dto';
import { AiResponseDto } from '../dto/ai-response.dto';
import type {
  AiHandler,
  AiHandlerContext,
} from '../interfaces/ai-handler.interface';
import { AiChatCompletionService } from '../services/ai-chat-completion.service';

@Injectable()
export class ChatHandler implements AiHandler {
  constructor(
    private readonly aiChatCompletionService: AiChatCompletionService,
  ) {}

  supports(modelType: string): boolean {
    return modelType === ModelType.TEXT;
  }

  async handle(
    request: AiRequestDto,
    context: AiHandlerContext,
  ): Promise<AiResponseDto> {
    if (!context.token) {
      const response = new AiResponseDto();
      response.success = false;
      response.data = { message: 'token is required for chat completion' };
      return response;
    }
    const data = await this.aiChatCompletionService.chatFromPayload(
      request.payload,
      context.token,
    );
    const response = new AiResponseDto();
    response.data = data;
    return response;
  }
}
