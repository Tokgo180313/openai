import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { SendChatDto } from '../dto/send-chat.dto';
import type { StreamCompletionUsageOut } from '../types/stream.types';
import {
  AiChatSendService,
  type ChatSendContext,
} from './ai-chat-send.service';

@Injectable()
export class AiStreamService {
  private readonly abortControllers = new Map<string, AbortController>();
  private readonly stoppedKeys = new Set<string>();

  constructor(private readonly aiChatSend: AiChatSendService) {}

  public async *streamChat(
    dto: SendChatDto,
    userId: string,
    usageOut?: StreamCompletionUsageOut,
    prepared?: ChatSendContext,
  ): AsyncGenerator<string> {
    const ctx = prepared ?? (await this.aiChatSend.prepareContext(dto, userId));
    const { openai, apiKey, baseURL, model } =
      await this.aiChatSend.resolveProviderClient(ctx);

    const streamKey = this.buildStreamKey(ctx.userId, ctx.documentId);
    this.stoppedKeys.delete(streamKey);
    const abortController = new AbortController();
    this.abortControllers.set(streamKey, abortController);

    await this.aiChatSend.saveUserMessage(dto, ctx, apiKey, baseURL, model);
    const messages = await this.aiChatSend.buildOpenAIMessages(openai, ctx);
    const body = this.aiChatSend.buildCompletionBody(
      model,
      messages,
      ctx.filteredParams,
      true,
    );

    try {
      const stream = (await openai.chat.completions.create(body, {
        signal: abortController.signal,
      } as any)) as AsyncIterable<OpenAI.ChatCompletionChunk>;

      for await (const chunk of stream) {
        if (this.stoppedKeys.has(streamKey)) break;
        if (chunk.usage && usageOut) {
          usageOut.usage = {
            prompt_tokens: chunk.usage.prompt_tokens,
            completion_tokens: chunk.usage.completion_tokens,
            total_tokens: chunk.usage.total_tokens,
          };
        }
        const piece = chunk.choices[0]?.delta?.content;
        if (piece) yield piece;
      }
    } catch (error: any) {
      if (abortController.signal.aborted || this.stoppedKeys.has(streamKey)) {
        return;
      }
      throw error;
    } finally {
      this.abortControllers.delete(streamKey);
    }
  }

  stopStream(userId: string, documentId: string): boolean {
    const streamKey = this.buildStreamKey(userId, documentId);
    this.stoppedKeys.add(streamKey);
    const controller = this.abortControllers.get(streamKey);
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  }

  clearStopped(userId: string, documentId: string): void {
    this.stoppedKeys.delete(this.buildStreamKey(userId, documentId));
  }

  isStopped(userId: string, documentId: string): boolean {
    return this.stoppedKeys.has(this.buildStreamKey(userId, documentId));
  }

  async saveAssistantResponse(
    response: string,
    model: string,
    documentId: string,
  ): Promise<void> {
    const trimmed = String(response ?? '').trim();
    const docId = String(documentId ?? '').trim();
    if (!trimmed || !docId) {
      throw new BadRequestException('response and documentId are required');
    }
    await this.aiChatSend.saveAssistantByDocumentId(trimmed, model, docId);
  }

  private buildStreamKey(userId: string, documentId: string): string {
    return `${userId}:${documentId}`;
  }
}
