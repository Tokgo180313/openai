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
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UsageService } from 'src/usage/usage.service';
import { GeminiUsageEntity } from 'src/usage/entity/gemini.usage.entity';
import { UsageEntity } from 'src/usage/entity/usage.entity';

/** OpenAI SDK 会在 baseURL 后拼接 `/chat/completions`；若 OPENAI_BASE_URL 已含该路径会导致 404。 */
function normalizeOpenAIBaseURL(raw: string | undefined): string | undefined {
  if (raw == null || typeof raw !== 'string') return undefined;
  let u = raw.trim();
  if (!u) return undefined;
  while (/\/chat\/completions\/?$/i.test(u)) {
    u = u.replace(/\/chat\/completions\/?$/i, '');
  }
  u = u.replace(/\/+$/, '');
  return u || undefined;
}

const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';
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
    if(!apiKey){
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
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
        content: response.choices[0].message.content || '',
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
  public async chatByChatgpt(messageDto: Array<MessageDto>, token: string) {
    try {
      const items = Array.isArray(messageDto) ? messageDto : [];
      if (items.length === 0) {
        throw new BadRequestException('messageDto is required');
      }

      const last = items[items.length - 1];
      const documentId = String(last?.id ?? '').trim();
      if (!documentId) {
        throw new BadRequestException('messageDto.id is required');
      }

      const question = last?.question;
      const questionContent = String(question?.content ?? '').trim();
      if (!questionContent) {
        throw new BadRequestException('question.content is required');
      }

      const normalizeRole = (role: string | undefined): 'system' | 'assistant' | 'user' => {
        const r = String(role ?? '').trim().toLowerCase();
        if (r === 'system') return 'system';
        if (r === 'assistant') return 'assistant';
        return 'user';
      };

      // 优先使用前端传入的 messages list；否则用 items.question 作为历史对话构造 messages
      let providedList: OpenAI.ChatCompletionMessageParam[] | undefined;
      for (const item of items.slice().reverse()) {
        if (Array.isArray(item?.list) && item.list.length > 0) {
          providedList = item.list;
          break;
        }
      }

      let messagesList: OpenAI.ChatCompletionMessageParam[];
      if (providedList && providedList.length > 0) {
        messagesList = providedList
          .map((m) => ({
            role: normalizeRole((m as any)?.role),
            content: String((m as any)?.content ?? '').trim(),
          }))
          .filter((m) => !!m.content);

        const lastRole = normalizeRole(question?.role);
        const lastMsg = messagesList[messagesList.length - 1];
        if (
          !lastMsg ||
          String(lastMsg.content ?? '').trim() !== questionContent ||
          lastMsg.role !== lastRole
        ) {
          messagesList.push({ role: lastRole, content: questionContent });
        }
      } else {
        messagesList = items
          .map((item) => ({
            role: normalizeRole(item?.question?.role),
            content: String(item?.question?.content ?? '').trim(),
          }))
          .filter((m) => !!m.content);

        // 确保包含本次用户输入
        if (
          messagesList.length === 0 ||
          String(messagesList[messagesList.length - 1]?.content ?? '').trim() !== questionContent
        ) {
          messagesList.push({
            role: normalizeRole(question?.role),
            content: questionContent,
          });
        }
      }

      if (messagesList.length === 0) {
        throw new BadRequestException('messagesList is empty');
      }

      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new InternalServerErrorException('OPENAI_API_KEY is not set');
      }

      const rawBase =
        this.configService.get<string>('OPENAI_BASE_URL') ??
        process.env['OPENAI_BASE_URL'];
      const baseURL = normalizeOpenAIBaseURL(rawBase) ?? OPENAI_DEFAULT_BASE_URL;

      const openai = new OpenAI({
        apiKey,
        baseURL,
      });

      const model = String(question?.useModel ?? '').trim() || 'gpt-4o-mini';
      const modelClassify = String(question?.modelClassify ?? '').trim() || 'OpenAI';

      const response: OpenAI.ChatCompletion = await openai.chat.completions.create({
        model,
        messages: messagesList,
      });

      const responseText = String(response?.choices?.[0]?.message?.content ?? '').trim();
      const responseRole = (response?.choices?.[0]?.message?.role ??
        'assistant') as OpenAI.ChatCompletionMessageParam['role'];

      // 1) 保存用户输入
      await new this.contentSchema({
        documentId,
        useModel: model,
        role: normalizeRole(question?.role),
        content: questionContent,
      }).save();

      // 2) 保存模型回复
      await new this.contentSchema({
        documentId,
        useModel: response.model ?? model,
        role: responseRole,
        content: responseText,
      }).save();

      // 3) 更新/新增聊天主题
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'my-secret-key',
      });
      const userId = payload.sub;

      const titleId = last?.titleId ? String(last.titleId).trim() : '';
      if (titleId) {
        await this.updateChatTitle(titleId);
      } else {
        const chatEntity = new ChatEntity({
          userId,
          documentId,
          title: questionContent,
        });
        await new this.chatTitleSchema(chatEntity).save();
      }

      // 4) 保存 usage（如果返回了）
      if (response.usage) {
        const usageEntity: UsageEntity = {
          modelName: response.model ?? model,
          modelClassify,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          status: '0',
          description: responseText,
        };
        await this.usageService.addUsage(usageEntity, userId);
      }

      return {
        documentId,
        useModel: response.model ?? model,
        role: responseRole,
        content: responseText,
      };
    } catch (error: any) {
      // NestJS 下抛出 BadRequestException 会更友好
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new Error(error?.message || 'Failed to chat with ChatGPT');
    }
  }
  public async chatByGemini(
    messageDto: MessageDto,
    token: string,
    userId: string,
  ) {
    return await this.generateText(messageDto?.question.content, userId);
  }
  /**
   * 基础文本生成
   * @param prompt 用户输入的提示词
   */
  async generateText(prompt: string, userId: string): Promise<string> {
    try {
      const response = await this.genAI.getGenerativeModel({ model: this.modelName }).generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        // Gemini 3 特有配置：思维层级 (Thinking Level)
        // 选项: 'minimal', 'low', 'medium', 'high'
        config: {
          thinkingConfig: {
            thinkingLevel: 'low',
          },
        },
      });
      this.usageService.addUsageByGemini(
        response.usageMetadata,
        userId,
        'gemini-3.5-flash',
        '0',
      );
      return response.text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      this.usageService.addUsageByGemini(
        {} as GeminiUsageEntity,
        userId,
        'gemini-3.5-flash',
        '1',
      );
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
    return await this.chatTitleSchema
      .find({ userId: payload.sub })
      .sort({ updatedAt: -1 })
      .exec();
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

  public async deleteChatTitleById(id: string, userId: string) {
    try {
      const chatInfo = await this.findOneChat(id);
      if (chatInfo && chatInfo.userId === userId) {
        await this.contentSchema.deleteMany({
          documentId: chatInfo.documentId,
        });
        const result = await this.chatTitleSchema.findByIdAndDelete(id).exec();
        return result;
      }
      throw new NotFoundException('chat title not found');
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
