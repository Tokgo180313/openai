import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
import { ChatDto } from './dto/chat.dto';
import {
  ChatTitle,
  ChatTitleSchema,
  ChatTitleDocument,
} from 'src/schemas/chat/chat.schema';
import { ChatEntity } from './entity/Chat.entity';
import { JwtService } from '@nestjs/jwt';
import { GoogleGenAI } from '@google/genai';
import { UsageService } from 'src/usage/usage.service';
import { GeminiUsageEntity } from 'src/usage/entity/gemini.usage.entity';
@Injectable()
export class ChatService {
  private genAI: any;
  private readonly modelName = 'gemini-3-flash-preview'; // 或 gemini
  constructor(
    @InjectModel(Content.name) private contentSchema: Model<ContentDocument>,
    @InjectModel(ChatTitle.name)
    private chatTitleSchema: Model<ChatTitleDocument>,
    private configService: ConfigService,
    private jwtService: JwtService,
    private usageService: UsageService,
  ) {}
  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    // 初始化 SDK
    this.genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        // 确保连接池配置合理
        timeout: 30000, // 设置为 30 秒，单位通常是 ms
      },
    });
  }
  public async completionFunction(
    id: string,
    titleId: string,
    question: QuestionDto,
    list: OpenAI.ChatCompletionMessageParam[],
    token: string,
  ) {
    try {
      const questionEntity: ContentEntity = {
        documentId: id,
        useModel: 'deepseek-chat',
        role: question.role,
        content: question.content,
      };
      // console.log(questionEntity, list);

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
        documentId: id,
        useModel: response.model,
        role: response.choices[0].message.role,
        content: response.choices[0].message.content,
      };
      // console.log(contentEntity);
      const responseInfo = new this.contentSchema(contentEntity);
      await responseInfo.save();
      if (titleId) {
        this.updateChatTitle(titleId);
      } else {
        this.addChatTitle(
          { documentId: id, keywordText: question.content },
          token,
        );
      }
      return contentEntity;
      //   return contentEntity;
    } catch (error) {
      console.error(error);

      throw new Error(error.messages);
    }
  }
  public async chatByChatgpt(messageDto: Array<MessageDto>) {
    if (messageDto) {
      console.log(messageDto);
    }
    return null;
  }
  public async chatByGemini(messageDto: MessageDto, token: string,userId:string) {
    return await this.generateText(messageDto?.question.content,userId);
  }
  /**
   * 基础文本生成
   * @param prompt 用户输入的提示词
   */
  async generateText(prompt: string ,userId:string): Promise<string> {
    try {
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        // Gemini 3 特有配置：思维层级 (Thinking Level)
        // 选项: 'minimal', 'low', 'medium', 'high'
        config: {
          thinkingConfig: {
            thinkingLevel: 'low',
          },
        },
      });
      this.usageService.addUsageByGemini(response.usageMetadata,userId,"gemini-3.5-flash","0");
      return response.text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      this.usageService.addUsageByGemini({} as GeminiUsageEntity,userId,"gemini-3.5-flash","1");
      throw new Error('Failed to generate content from Gemini');
    }
  }
  /**
   * 新增聊天主题
   * @param chatDto
   * @param userId
   * @returns
   */
  public async addChatTitle(chatDto: ChatDto, token: string) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET || 'my-secret-key',
    });
    let chatEntity = new ChatEntity({
      userId: payload.sub,
      documentId: chatDto.documentId || '',
      title: chatDto.keywordText || '',
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
      .updateOne({ _id: id }, { $set: { updatedAt: new Date() } })
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
  public async chatTitleList(token: string) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET || 'my-secret-key',
    });
    return await this.chatTitleSchema.find({ userId: payload.sub }).sort({ updatedAt: -1 }).exec();
  }
  /**
   * 查找聊天列表
   * @param chatDto
   */
  public async chatList(id: string) {
    return await this.contentSchema.find({ documentId: id }).exec();
  }

  /**
   * 查找聊天主题对应的内容
   * @param id
   * @returns
   */
  public async chatInfo(id: string) {
    return await this.contentSchema.findById(id).exec();
  }

  public async deleteChatTitleById(id: string,userId:string) {
    try {
      const chatInfo = await this.findOneChat(id);
      if (chatInfo && chatInfo.userId === userId) {
        await this.contentSchema.deleteMany({ documentId: chatInfo.documentId });
        const result = await this.chatTitleSchema.findByIdAndDelete(id).exec();
        return result;
      }
      throw new NotFoundException('chat title not found');
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
