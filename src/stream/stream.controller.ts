import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { StreamCompletionUsageOut, StreamService } from './stream.service';
import type { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { SendChatDto } from 'src/ai/dto/send-chat.dto';
import { AiChatSendService } from 'src/ai/services/ai-chat-send.service';
import { UsageService } from 'src/usage/usage.service';

@ApiTags('stream')
@Controller('/stream')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private readonly aiChatSendService: AiChatSendService,
    private readonly usageService: UsageService,
  ) {}

  /** @deprecated 请使用 POST /ai/stream */
  @Post('/generateContentStream')
  public async generateContentStream(
    @Body() dto: SendChatDto,
    @Res() res: Response,
    @CurrentUser('id') userId: string,
  ) {
    const ctx = await this.aiChatSendService.prepareContext(dto, userId);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      let responseContent = '';
      let stopped = false;
      const usageOut: StreamCompletionUsageOut = {};
      for await (const chunk of this.streamService.streamChat(
        dto,
        userId,
        usageOut,
        ctx,
      )) {
        responseContent += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      if (usageOut.usage) {
        try {
          await this.usageService.addUsage(
            {
              modelName: ctx.model.apiModelName,
              provider: ctx.model.provider,
              promptTokens: usageOut.usage.prompt_tokens,
              completionTokens: usageOut.usage.completion_tokens,
              totalTokens: usageOut.usage.total_tokens,
              description: `stream documentId=${ctx.documentId}`,
            },
            userId,
          );
        } catch (err) {
          console.error('generateContentStream addUsage failed:', err);
        }
      }
      stopped = this.streamService.isStopped(userId, ctx.documentId);
      res.write(
        `data: ${JSON.stringify({
          done: true,
          stopped,
          documentId: ctx.documentId,
          titleId: (ctx.createdTitleId ?? ctx.titleId) || undefined,
          clientMessageId: dto.clientMessageId,
        })}\n\n`,
      );
      if (!stopped && responseContent) {
        await this.streamService.saveAssistantResponse(
          responseContent,
          ctx.model.apiModelName,
          ctx.documentId,
        );
      }
      res.end();
      this.streamService.clearStopped(userId, ctx.documentId);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        const message =
          error instanceof Error ? error.message : 'stream failed';
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
      }
    }
  }

  @Post('/stopStream')
  public async stopStream(
    @Body('documentId') documentId: string,
    @Body('clientMessageId') clientMessageId: string,
    @CurrentUser('id') userId: string,
  ) {
    const targetDocumentId =
      String(documentId ?? '').trim() ||
      String(clientMessageId ?? '').trim();
    if (!targetDocumentId) {
      throw new BadRequestException('documentId or clientMessageId is required');
    }
    const stopped = this.streamService.stopStream(userId, targetDocumentId);
    return {
      success: true,
      stopped,
      documentId: targetDocumentId,
    };
  }
}
