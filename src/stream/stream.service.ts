import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { QuestionDto } from 'src/chat/dto/question.dto';
import { ChatTitle, ChatTitleDocument } from 'src/schemas/chat/chat.schema';
import { Content, ContentDocument } from 'src/schemas/content/content.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { MessageDto } from 'src/chat/dto/MessageDto';
import { ContentEntity } from 'src/chat/entity/ContentEntity';
import { ChatService } from 'src/chat/chat.service';
import { UsageService } from 'src/usage/usage.service';
import { UsageEntity } from 'src/usage/entity/usage.entity';

@Injectable()
export class StreamService {
  constructor(
    @InjectModel(Content.name) private contentSchema: Model<ContentDocument>,
    @InjectModel(ChatTitle.name) private chatTitle: Model<ChatTitleDocument>,
    private configService: ConfigService,
    private chatService: ChatService,
    private usageService: UsageService,
  ) {}

  public async completionStreamFunction(
    dto: MessageDto,
  ): Promise<Stream<OpenAI.ChatCompletionChunk>> {
    const questionEntity = {
      documentId: dto.id,
      useModel: dto.question.useModel,
      role: dto.question.role,
      content: dto.question.content,
      modelClassify: dto.question.modelClassify,
    };
    await this.saveQuestion(questionEntity);
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: this.configService.get('VUE_APP_API_KEY'),
    });
    return (await openai.chat.completions.create({
      messages: dto.list,
      model: dto.question.useModel,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    })) as Stream<OpenAI.ChatCompletionChunk>;
  }

  public async saveQuestion(dto: QuestionDto) {
    try {
      console.log('dto', dto);
      return new this.contentSchema(dto).save();
    } catch (error) {
      console.error('error', error);
      throw error;
    }
  }
  public async saveResponse(dto: ContentEntity) {
    try {
      const result = await new this.contentSchema(dto).save();
      return result;
    } catch (error) {
      console.error('error', error);
      throw error;
    }
  }
  public async updateTitle(dto: MessageDto, token: string) {
    if (dto.titleId) {
      this.chatService.updateChatTitle(dto.titleId);
    } else {
      this.chatService.addChatTitle(
        {
          documentId: dto.id,
          keywordText: dto.question.content,
        },
        token,
      );
    }
  }
}
