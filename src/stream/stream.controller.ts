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

    // 设置响应头，告知客户端这是一个流式响应
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
      for await (const chunk of this.streamService.streamGenerateContentByOpenAI(streamDto)) {
        // 直接写回增量文本
        res.write(chunk);
      }
      res.end();
    } catch (error) {
      console.error('generateContentStream error:', error, 'userId:', userId);
      res.status(500).end();
    }
  }
}
