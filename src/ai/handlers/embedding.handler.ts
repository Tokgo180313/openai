import { Injectable } from '@nestjs/common';
import { ModelType } from '../enums/model-type.enum';
import type { AiRequestDto } from '../dto/ai-request.dto';
import { AiResponseDto } from '../dto/ai-response.dto';
import type {
  AiHandler,
  AiHandlerContext,
} from '../interfaces/ai-handler.interface';

@Injectable()
export class EmbeddingHandler implements AiHandler {
  supports(modelType: string): boolean {
    return modelType === ModelType.EMBEDDING;
  }

  async handle(
    _request: AiRequestDto,
    _context: AiHandlerContext,
  ): Promise<AiResponseDto> {
    const response = new AiResponseDto();
    response.data = { message: 'embedding handler not implemented' };
    return response;
  }
}
