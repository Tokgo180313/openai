import { Injectable } from '@nestjs/common';
import { AiStreamService } from 'src/ai/services/ai-stream.service';
import {
  AiChatSendService,
  type ChatSendContext,
} from 'src/ai/services/ai-chat-send.service';
import type { SendChatDto } from 'src/ai/dto/send-chat.dto';
import type { StreamCompletionUsageOut } from 'src/ai/types/stream.types';

export type { StreamCompletionUsageOut } from 'src/ai/types/stream.types';

/** @deprecated 实现已迁至 ai 模块，本类仅作兼容委托 */
@Injectable()
export class StreamService {
  constructor(
    private readonly aiStreamService: AiStreamService,
    private readonly aiChatSendService: AiChatSendService,
  ) {}

  public streamChat(
    dto: SendChatDto,
    userId: string,
    usageOut?: StreamCompletionUsageOut,
    prepared?: ChatSendContext,
  ) {
    return this.aiStreamService.streamChat(dto, userId, usageOut, prepared);
  }

  public stopStream(userId: string, documentId: string) {
    return this.aiStreamService.stopStream(userId, documentId);
  }

  public clearStopped(userId: string, documentId: string) {
    return this.aiStreamService.clearStopped(userId, documentId);
  }

  public isStopped(userId: string, documentId: string) {
    return this.aiStreamService.isStopped(userId, documentId);
  }

  public saveAssistantResponse(
    response: string,
    model: string,
    documentId: string,
  ) {
    return this.aiStreamService.saveAssistantResponse(
      response,
      model,
      documentId,
    );
  }

  public completeOnce(
    dto: SendChatDto,
    userId: string,
    usageOut?: StreamCompletionUsageOut,
  ) {
    return this.aiChatSendService.completeOnce(dto, userId, usageOut);
  }
}
