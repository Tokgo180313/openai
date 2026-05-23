import { Injectable } from '@nestjs/common';
import { ModelType } from '../enums/model-type.enum';
import type { AiRequestDto } from '../dto/ai-request.dto';
import { AiResponseDto } from '../dto/ai-response.dto';
import type {
  AiHandler,
  AiHandlerContext,
} from '../interfaces/ai-handler.interface';
import { MessagesValidator } from '../validators/messages.validator';

@Injectable()
export class MultimodalHandler implements AiHandler {
  constructor(private readonly messagesValidator: MessagesValidator) {}

  supports(modelType: string): boolean {
    return modelType === ModelType.VISION || modelType === ModelType.MULTIMODAL;
  }

  async handle(
    request: AiRequestDto,
    _context: AiHandlerContext,
  ): Promise<AiResponseDto> {
    this.messagesValidator.validate(request.payload);
    const response = new AiResponseDto();
    response.data = { message: 'multimodal handler not implemented' };
    return response;
  }
}
