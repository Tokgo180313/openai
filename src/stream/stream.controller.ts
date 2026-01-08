import {
  Body,
  Controller,
  HttpException,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MessageDto } from 'src/chat/dto/MessageDto';
import { StreamService } from './stream.service';
import type { Response } from 'express';
import { ContentEntity } from 'src/chat/entity/ContentEntity';
import { v4 as uuid } from 'uuid';
import { Token } from 'src/common/decorators/token.decorator';
@ApiTags('stream')
@Controller('/stream')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Post('/deepseek')
  public async deepseekStream(
    @Body() messageDto: MessageDto,
    @Res() res: Response,
    @Token() token:string
  ) {
    if (!messageDto) {
      throw new Error('messageDto is required!');
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      await this.streamService.updateTitle(messageDto,token)
      const stream = await this.streamService.completionStreamFunction(
        messageDto,
      );
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  @Post('/chatgpt')
  public async chatgptStream() {}

  @Post('/saveResponse')
  public async saveContent(@Body() dto: ContentEntity) {
    dto.id = uuid();
    return await this.streamService.saveResponse(dto);
  }
}
