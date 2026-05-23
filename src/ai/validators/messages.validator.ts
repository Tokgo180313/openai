import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class MessagesValidator {
  validate(payload: Record<string, unknown>): void {
    const messages = payload.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestException('payload.messages is required');
    }
    for (const item of messages) {
      if (item == null || typeof item !== 'object') {
        throw new BadRequestException('invalid message item');
      }
      const role = String((item as { role?: unknown }).role ?? '').trim();
      if (!role) {
        throw new BadRequestException('message.role is required');
      }
    }
  }
}
