import { Injectable } from '@nestjs/common';
import { ModelType } from '../enums/model-type.enum';
import type { AiRequestDto } from '../dto/ai-request.dto';
import { AiResponseDto } from '../dto/ai-response.dto';
import type {
  AiHandler,
  AiHandlerContext,
} from '../interfaces/ai-handler.interface';
import { ImageValidator } from '../validators/image.validator';

@Injectable()
export class ImageEditHandler implements AiHandler {
  constructor(private readonly imageValidator: ImageValidator) {}

  supports(modelType: string): boolean {
    return modelType === 'image_edit';
  }

  async handle(
    request: AiRequestDto,
    _context: AiHandlerContext,
  ): Promise<AiResponseDto> {
    this.imageValidator.validateEdit(request.payload);
    const response = new AiResponseDto();
    response.data = { message: 'image edit handler not implemented' };
    return response;
  }
}
