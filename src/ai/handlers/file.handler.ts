import { Injectable } from '@nestjs/common';
import type { AiRequestDto } from '../dto/ai-request.dto';
import { AiResponseDto } from '../dto/ai-response.dto';
import type {
  AiHandler,
  AiHandlerContext,
} from '../interfaces/ai-handler.interface';

@Injectable()
export class FileHandler implements AiHandler {
  supports(modelType: string): boolean {
    return modelType === 'file';
  }

  async handle(
    _request: AiRequestDto,
    _context: AiHandlerContext,
  ): Promise<AiResponseDto> {
    const response = new AiResponseDto();
    response.data = { message: 'file handler not implemented' };
    return response;
  }
}
