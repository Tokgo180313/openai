import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { Model, now } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ContentEntity } from './entity/ContentEntity';
import { InjectModel } from '@nestjs/mongoose';
import {
  ContentDocument,
  Content,
  ContentSchema,
} from 'src/schemas/content/content.schema';
import { MessageDto } from './dto/MessageDto';
import { QuestionDto } from './dto/question.dto';
import { v4 as uuid } from 'uuid';
@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Content.name) private contentSchema: Model<ContentDocument>,
    private configService: ConfigService,
  ) {}

  public async completionFunction(
    id: string,
    question: QuestionDto,
    list: OpenAI.ChatCompletionMessageParam[],
  ) {
    try {
      const questionEntity: ContentEntity = {
        id:uuid(),
        documentId: id,
        useModel: 'deepseek-chat',
        created: new Date().getTime(),
        role: question.role,
        content: question.content,
      };
      console.log(questionEntity, list);

      const questionInfo = new this.contentSchema(
        questionEntity,
      );
      await questionInfo.save();
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: this.configService.get('VUE_APP_API_KEY'),
      });
      let response: OpenAI.ChatCompletion =
        await openai.chat.completions.create({
          messages: list,
          model: 'deepseek-chat',
        });
      let contentEntity: ContentEntity = {
        id:uuid(),
        documentId: id,
        useModel: response.model,
        created: response.created,
        role: response.choices[0].message.role,
        content: response.choices[0].message.content,
      };
      console.log(contentEntity);
      const responseInfo = new this.contentSchema(contentEntity);
      await responseInfo.save();
      return contentEntity;
      //   return contentEntity;
    } catch (error) {
      console.error(error);

      throw new Error(error.messages);
    }
  }
}
