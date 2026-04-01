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
import { MessageDto } from 'src/chat/dto/MessageDto';
import { StreamService } from './stream.service';
import type { Response } from 'express';
import { ContentEntity } from 'src/chat/entity/ContentEntity';
import { Token } from 'src/common/decorators/token.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UsageEntity } from 'src/usage/entity/usage.entity';
import { UsageService } from 'src/usage/usage.service';
import { ModelService } from 'src/models/models.service';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
@ApiTags('stream')
@Controller('/stream')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private readonly usageService: UsageService,
    private readonly modelsService: ModelService,
    private readonly encryptionService: EncryptionService,
  ) {}

  @Post('/deepseek')
  public async deepseekStream(
    @Body() messageDto: MessageDto,
    @Res() res: Response,
    @Token() token: string,
    @CurrentUser('id') userId: string,
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
      const model =
        await this.modelsService.findModelByModelNameAndModelClassify(
          messageDto.question.useModel,
          messageDto.question.modelClassify,
        );
      if (!model) {
        throw new Error('model not found');
      }
      if (!model.apiKey) {
        throw new Error('model apiKey is required');
      }
      const apiKey = this.encryptionService.decrypt(model.apiKey);
      if (!apiKey) {
        throw new Error('apiKey is required');
      }
      if (!model.baseURL) {
        throw new Error('model baseURL is required');
      }
      await this.streamService.updateTitle(messageDto, token);
      const stream = await this.streamService.completionStreamFunction(
        messageDto,
        apiKey,
        model.baseURL,
      );
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
        if (chunk.usage) {
          const usageEntity: UsageEntity = {
            modelName: messageDto.question.useModel,
            modelClassify: messageDto.question.modelClassify,
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
            status: '0',
          };
          const usage = await this.usageService.addUsage(usageEntity, userId);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      const usageEntity: UsageEntity = {
        modelName: messageDto.question.useModel,
        modelClassify: messageDto.question.modelClassify,
        status: '1',
        description: error.message,
      };
      const usage = await this.usageService.addUsage(usageEntity, userId);
      throw error;
    }
  }
  @Post('/gemini')
  public async geminiStream(
    @Body() messageDto: MessageDto,
    @Res() res: Response,
    @Token() token: string,
    @CurrentUser('id') userId: string,
  ) {
    // 1. 设置响应头，告知客户端这是一个流式响应
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    try {
      // 2. 获取 Service 返回的异步生成器
      const stream = this.streamService.streamGenerateContent(messageDto.question.content);

      // 3. 遍历并写入响应流
      for await (const chunk of stream) {
        res.write(chunk);
      }

      // 4. 传输完成，关闭响应
      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      res.status(500).end();
    }
  }
  @Post('/chatgpt')
  public async chatgptStream(
    @Body() messageDto: MessageDto,
    @Res() res: Response,
    @Token() token: string,
    @CurrentUser('id') userId: string,
  ) {
    const stream = this.streamService.streamGenerateContentByChatgpt(messageDto.question.content);
    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  }
}
