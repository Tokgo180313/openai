import {
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { StreamService } from './stream.service';
import type { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { StreamMessageDto } from './dto/stream.dto';
@ApiTags('stream')
@Controller('/stream')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Post('/generateContentStream')
  public async generateContentStream(
    @Body() streamDto: StreamMessageDto,
    @Res() res: Response,
    @CurrentUser('id') userId: string,
  ) {
    streamDto.userId = userId;
    console.log('generateContentStream streamDto:', streamDto);

    // Server-Sent Events（text/event-stream）
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const chunk of this.streamService.streamGenerateContentByOpenAI(streamDto)) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error('generateContentStream error:', error, 'userId:', userId);
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
