import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Token } from 'src/common/decorators/token.decorator';
import { UsageService } from 'src/usage/usage.service';
import { AiService } from './ai.service';
import { AiRequestDto } from './dto/ai-request.dto';
import { SendChatDto } from './dto/send-chat.dto';
import { AiChatSendService } from './services/ai-chat-send.service';
import { AiStreamService } from './services/ai-stream.service';
import type { StreamCompletionUsageOut } from './types/stream.types';

@ApiTags('ai')
@Controller('/ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiStreamService: AiStreamService,
    private readonly aiChatSendService: AiChatSendService,
    private readonly usageService: UsageService,
  ) {}

  @Post('/invoke')
  invoke(
    @Body() dto: AiRequestDto,
    @CurrentUser('id') userId: string,
    @Token() token: string,
  ) {
    return this.aiService.invoke(dto, userId, token);
  }

  /**
   * 统一聊天入口：SendChatDto
   * stream=true（默认）返回 SSE；stream=false 返回 JSON
   */
  @Post('/stream')
  async stream(
    @Body() dto: SendChatDto,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('id') userId: string,
  ) {
    const useStream = dto.stream !== false;
    if (!useStream) {
      const usageOut: StreamCompletionUsageOut = {};
      const result = await this.aiChatSendService.completeOnce(
        dto,
        userId,
        usageOut,
      );
      if (usageOut.usage) {
        try {
          await this.usageService.addUsage(
            {
              modelName: result.model,
              provider: result.provider,
              promptTokens: usageOut.usage.prompt_tokens,
              completionTokens: usageOut.usage.completion_tokens,
              totalTokens: usageOut.usage.total_tokens,
              description: `chat documentId=${result.documentId}`,
            },
            userId,
          );
        } catch (err) {
          console.error('ai chat addUsage failed:', err);
        }
      }
      return result;
    }

    const ctx = await this.aiChatSendService.prepareContext(dto, userId);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      let responseContent = '';
      const usageOut: StreamCompletionUsageOut = {};
      for await (const chunk of this.aiStreamService.streamChat(
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
          console.error('ai stream addUsage failed:', err);
        }
      }
      const stopped = this.aiStreamService.isStopped(
        userId,
        ctx.documentId,
      );
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
        await this.aiStreamService.saveAssistantResponse(
          responseContent,
          ctx.model.apiModelName,
          ctx.documentId,
        );
      }
      res.end();
      this.aiStreamService.clearStopped(userId, ctx.documentId);
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

  @Post('/stream/stop')
  stopStream(
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
    const stopped = this.aiStreamService.stopStream(
      userId,
      targetDocumentId,
    );
    return { success: true, stopped, documentId: targetDocumentId };
  }
}
