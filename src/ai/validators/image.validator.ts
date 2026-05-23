import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ImageValidator {
  validateGenerate(payload: Record<string, unknown>): void {
    const prompt = String(payload.prompt ?? '').trim();
    if (!prompt) {
      throw new BadRequestException('payload.prompt is required');
    }
  }

  validateEdit(payload: Record<string, unknown>): void {
    const prompt = String(payload.prompt ?? '').trim();
    if (!prompt) {
      throw new BadRequestException('payload.prompt is required');
    }
    const hasImage =
      Boolean(payload.image) ||
      Boolean(payload.image_base64) ||
      (Array.isArray(payload.imageList) && payload.imageList.length > 0);
    if (!hasImage) {
      throw new BadRequestException('image input is required for edit');
    }
  }
}
