import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Observable } from 'rxjs';
@Injectable()
export class StreamService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  constructor(
    @InjectModel(Content.name) private contentSchema: Model<ContentDocument>,
    @InjectModel(ChatTitle.name) private chatTitle: Model<ChatTitleDocument>,
    private configService: ConfigService,
    private chatService: ChatService,
    private usageService: UsageService,
  ) {}
  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if(!apiKey){
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  public async completionStreamFunction(
    dto: MessageDto,
    apiKey: string,
    baseURL: string,
  ): Promise<Stream<OpenAI.ChatCompletionChunk>> {
    const questionContent = String(dto?.question?.content ?? '').trim();
    if (!questionContent) {
      throw new BadRequestException('question.content is required');
    }
    const questionEntity = {
      documentId: dto.id,
      useModel: dto.question.useModel,
      role: dto.question.role,
      content: questionContent,
      modelClassify: dto.question.modelClassify,
    };
    await this.saveQuestion(questionEntity);
    const messages = await this.chatService.chatList(dto.id);
    const messagesList: OpenAI.ChatCompletionMessageParam[] = messages.map(
      (item): OpenAI.ChatCompletionMessageParam => {
        const content = String(item?.content ?? '');
        const role = String(item?.role ?? '').toLowerCase();

        // openai@5 的 ChatCompletionMessageParam 是按 role 区分的联合类型；
        // 我们这里只发送纯文本消息，统一约束到常用的 3 种 role，避免落入 'function'/'tool' 分支导致额外字段必填。
        if (role === 'system') return { role: 'system', content };
        if (role === 'assistant') return { role: 'assistant', content };
        return { role: 'user', content };
      },
    );
    if (messagesList.length === 0) {
      throw new Error('messagesList is empty');
    }
    const openai = new OpenAI({
      baseURL: baseURL,
      apiKey: apiKey,
    });
    return (await openai.chat.completions.create({
      messages: messagesList,
      model: dto.question.useModel,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    })) as Stream<OpenAI.ChatCompletionChunk>;
  }
  public async *streamGenerateContent(prompt: string): AsyncGenerator<string> {
    const result = await this.model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }
  public async *streamGenerateContentByChatgpt(prompt: string): AsyncGenerator<string> {
    const result = await this.chatService.streamGenerateContent(prompt);
    for await (const chunk of result) {
      yield chunk.choices[0]?.delta?.content;
    }
  }
  public async saveQuestion(dto: QuestionDto) {
    try {
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
