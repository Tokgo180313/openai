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
import { v4 as uuid } from 'uuid';
import { ChatService } from 'src/chat/chat.service';
@Injectable()
export class StreamService {
  constructor(
    @InjectModel(Content.name) private contentSchema: Model<ContentDocument>,
    @InjectModel(ChatTitle.name) private chatTitle: Model<ChatTitleDocument>,
    private configService:ConfigService,
    private chatService:ChatService
  ) {}

  public async completionStreamFunction(
    dto:MessageDto
  ) :Promise<Stream<OpenAI.ChatCompletionChunk>>{
    const questionEntity = {
      id: uuid(),
      documentId: dto.id,
      useModel: 'deepseek-chat',
      role: dto.question.role,
      content: dto.question.content,
    };
    await this.saveQuestion(questionEntity);
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: this.configService.get('VUE_APP_API_KEY'),
    });
    return (await openai.chat.completions.create({
      messages: dto.list,
      model: 'deepseek-chat',
      stream:true,
    })) as Stream<OpenAI.ChatCompletionChunk>;
  }

  public async saveQuestion(dto: QuestionDto) {
    return new this.contentSchema(dto).save();
  }
  public async saveResponse(dto:ContentEntity){
    return new this.contentSchema(dto).save();
  }
  public async updateTitle(dto:MessageDto,token:string){
    if(dto.titleId){
        this.chatService.updateChatTitle(dto.titleId)
    }else{
        this.chatService.addChatTitle({
            documentId:dto.id,
            keywordText:dto.question.content,
            
        },token)
    }
  }
}
