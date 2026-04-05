import {
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
import { StreamMessageDto } from './dto/stream.dto';
import { UsageService } from 'src/usage/usage.service';

@ApiTags('stream')
@Controller('/stream')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private readonly usageService: UsageService,
  ) {}

  @Post('/generateContentStream')
  public async generateContentStream(
    @Body() streamDto: StreamMessageDto,
    @Res() res: Response,
    @CurrentUser('id') userId: string,
  ) {
    streamDto.userId = userId;
    // Server-Sent Events（text/event-stream）
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      let responseContent = '';
      const usageOut: StreamCompletionUsageOut = {};
      for await (const chunk of this.streamService.streamGenerateContentByOpenAI(
        streamDto,
        usageOut,
      )) {
        responseContent += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      if (usageOut.usage) {
        try {
          await this.usageService.addUsage(
            {
              modelName: streamDto.model,
              modelClassify: streamDto.modelClassify,
              promptTokens: usageOut.usage.prompt_tokens,
              completionTokens: usageOut.usage.completion_tokens,
              totalTokens: usageOut.usage.total_tokens,
              description: `stream documentId=${streamDto.documentId ?? ''}`,
            },
            userId,
          );
        } catch (err) {
          console.error('generateContentStream addUsage failed:', err);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      await this.streamService.saveResponse(responseContent, streamDto.model, streamDto.documentId);
      res.end();
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
}
