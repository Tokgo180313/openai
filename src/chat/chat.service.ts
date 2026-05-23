import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
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
import { ChatDto } from './dto/chat.dto';
import { UpdateChatTitleDto } from './dto/update-chat-title.dto';
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
import { readFile } from 'node:fs/promises';
import { inferUserContentInputType } from 'src/common/utils/user-input-type.util';
import { AiChatCompletionService } from 'src/ai/services/ai-chat-completion.service';
import { MessageAttachmentService } from 'src/message-attachments/message-attachment.service';

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
    @Inject(forwardRef(() => AiChatCompletionService))
    private readonly aiChatCompletionService: AiChatCompletionService,
    private readonly messageAttachmentService: MessageAttachmentService,
  ) {}
  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    // 初始化 SDK
    if(!apiKey){
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  public async chatByChatgpt(messageDto: MessageDto, token: string) {
    return this.aiChatCompletionService.chatByChatgpt(messageDto, token);
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
  public async chatTitleList(token: string, page: number = 1) {
    const pageSize = 10;
    const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET || 'my-secret-key',
    });
    const list = await this.chatTitleSchema
      .find({ userId: payload.sub })
      .sort({ updatedAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .exec();
    return {
      list,
      page: currentPage,
      pageSize,
      hasMore: list.length === pageSize,
    };
  }
  /**
   * 查找聊天列表
   * @param chatDto
   */
  public async chatList(id: string, userId?: string) {
    const list = await this.contentSchema
      .find({ documentId: id })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    const uid = String(userId ?? '').trim();
    if (uid) {
      const messageIds = (list as Record<string, any>[])
        .map((item) => String(item?._id ?? '').trim())
        .filter(Boolean);
      const attachmentMap =
        await this.messageAttachmentService.findByMessageIds(
          messageIds,
          uid,
        );
      for (const item of list as Record<string, any>[]) {
        const mid = String(item?._id ?? '').trim();
        const attachments = attachmentMap.get(mid);
        if (attachments?.length) {
          item.attachments = attachments;
        }
      }
    }

    for (const item of list as Record<string, any>[]) {
      const role = String(item?.role ?? '').trim().toLowerCase();
      if (role === 'user') {
        item.type = inferUserContentInputType(item);
      }
      if (String(item?.type ?? '').trim() !== 'input_url') {
        continue;
      }
      const fileUrl =
        String(item?.fileUrl ?? '').trim() || String(item?.file_url ?? '').trim();
      if (!fileUrl) {
        continue;
      }
      try {
        const buffer = await readFile(fileUrl);
        const ext = fileUrl.split('.').pop()?.toLowerCase();
        const fallbackMime =
          ext === 'png'
            ? 'image/png'
            : ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : ext === 'webp'
                ? 'image/webp'
                : ext === 'gif'
                  ? 'image/gif'
                  : 'application/octet-stream';
        const mimeType =
          String(item?.mimeType ?? '').trim() || fallbackMime;
        item.file = `data:${mimeType};base64,${buffer.toString('base64')}`;
      } catch {
        // 图片文件不存在或不可读时，保持原 content 返回。
      }
    }
    return list as any[];
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

  public async updateChatTitleById(
    updateChatTitleDto: UpdateChatTitleDto,
    userId: string,
  ) {
    try {
      const titleId = String(updateChatTitleDto?.titleId ?? '').trim();
      const title = String(updateChatTitleDto?.title ?? '').trim();
      if (!titleId) {
        throw new BadRequestException('titleId is required');
      }
      if (!title) {
        throw new BadRequestException('title is required');
      }
      const chatInfo = await this.findOneChat(titleId);
      if (!chatInfo || chatInfo.userId !== userId) {
        throw new NotFoundException('chat title not found');
      }
      return await this.chatTitleSchema
        .findByIdAndUpdate(
          titleId,
          { title, updatedAt: new Date() },
          { new: true },
        )
        .exec();
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async addNewTitle(chatEntity: ChatEntity){
    return await new this.chatTitleSchema(chatEntity).save();
  }
  public async addNewContent(content: ContentEntity){
    return await new this.contentSchema(content).save();
  }

  public async replaceOpenaiFileId(
    documentId: string,
    oldOpenaiFileId: string,
    newOpenaiFileId: string,
  ) {
    const targetDocumentId = String(documentId ?? '').trim();
    const oldId = String(oldOpenaiFileId ?? '').trim();
    const newId = String(newOpenaiFileId ?? '').trim();
    if (!targetDocumentId || !oldId || !newId || oldId === newId) {
      return;
    }
    await this.contentSchema.updateMany(
      { documentId: targetDocumentId, openaiFileId: oldId },
      { $set: { openaiFileId: newId } },
    );
  }
}
