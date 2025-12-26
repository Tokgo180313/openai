import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
import { ChatDto } from './dto/chat.dto';
import {
  ChatTitle,
  ChatTitleSchema,
  ChatTitleDocument,
} from 'src/schemas/chat/chat.schema';
import { ChatEntity } from './entity/Chat.entity';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Content.name) private contentSchema: Model<ContentDocument>,
    @InjectModel(ChatTitle.name)
    private chatTitleSchema: Model<ChatTitleDocument>,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  public async completionFunction(
    id: string,
    question: QuestionDto,
    list: OpenAI.ChatCompletionMessageParam[],
  ) {
    try {
      const questionEntity: ContentEntity = {
        id: uuid(),
        documentId: id,
        useModel: 'deepseek-chat',
        created: new Date().getTime(),
        role: question.role,
        content: question.content,
      };
      console.log(questionEntity, list);

      const questionInfo = new this.contentSchema(questionEntity);
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
        id: uuid(),
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
  /**
   * 新增聊天主题
   * @param chatDto
   * @param userId
   * @returns
   */
  public async addChatTitle(chatDto: ChatDto,token:string) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET || 'my-secret-key',
    });
    let chatEntity = new ChatEntity({
      id: uuid(),
      userId: payload.sub,
      documentId: chatDto.documentId,
      title: chatDto.keywordText,
    });
    return await new this.chatTitleSchema(chatEntity).save();
  }

  /**
   * 根据ID查找聊天
   * @param id
   * @returns
   */
  public async findOneChat(id: string) {
    return await this.chatTitleSchema.findById(id);
  }
  /**
   * 更新聊天时间
   * @param id
   * @returns
   */
  public async updateChatTitle(id) {
    return await this.chatTitleSchema
      .updateOne({ id: id }, { $set: { updateAt: new Date() } })
      .exec();
  }

  /**
   * 根据ID删除聊天
   * @param id
   * @returns
   */
  public async deleteChatTitle(id: string) {
    let chatInfo = await this.findOneChat(id);
    try {
      if (chatInfo && chatInfo.documentId) {
        await this.contentSchema.findByIdAndDelete(chatInfo.documentId);
        return this.chatTitleSchema.findByIdAndDelete(chatInfo.id);
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  /**
   * 获取title列表
   * @param token 
   * @returns 
   */
  public async chatTitleList(token:string){
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET || 'my-secret-key',
    });
    return await this.chatTitleSchema.find({userId:payload.sub}).exec()
  }
  /**
   * 查找聊天列表
   * @param chatDto
   */
  public async chatList(id:string) {
    return await this.contentSchema.find({documentId:id}).exec()
  }

  /**
   * 查找聊天主题对应的内容
   * @param id
   * @returns
   */
  public async chatInfo(id: string) {
    return await this.contentSchema.findById(id).exec();
  }
}
