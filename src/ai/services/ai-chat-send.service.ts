import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { AiModel } from 'src/ai-models/entities/ai-model.entity';
import { ChatService } from 'src/chat/chat.service';
import { ChatEntity } from 'src/chat/entity/Chat.entity';
import type { SendChatDto } from '../dto/send-chat.dto';
import {
  assertSendChatPayload,
  attachmentToContentEntity,
  titleSeedFromPayload,
} from '../utils/chat-attachment.util';
import { AiService } from '../ai.service';
import type { StreamCompletionUsageOut } from '../types/stream.types';
import { MessageAssemblyService } from './message-assembly.service';
import { ParamFilterService } from './param-filter.service';
import { ProviderClientService } from './provider-client.service';
import { MessageAttachmentService } from 'src/message-attachments/message-attachment.service';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';

export type ChatSendContext = {
  userId: string;
  titleId: string;
  documentId: string;
  model: AiModel;
  filteredParams: Record<string, unknown>;
  /** 本次请求新创建的会话标题 ID */
  createdTitleId?: string;
};

@Injectable()
export class AiChatSendService {
  constructor(
    @InjectRepository(AiModel)
    private readonly aiModelRepo: Repository<AiModel>,
    private readonly chatService: ChatService,
    private readonly messageAssembly: MessageAssemblyService,
    private readonly paramFilter: ParamFilterService,
    private readonly providerClient: ProviderClientService,
    private readonly aiService: AiService,
    private readonly messageAttachmentService: MessageAttachmentService,
  ) {}

  async prepareContext(dto: SendChatDto, userId: string): Promise<ChatSendContext> {
    assertSendChatPayload(dto);

    const titleId = String(dto?.titleId ?? '').trim();
    const clientMessageId = String(dto?.clientMessageId ?? '').trim();
    let documentId = '';

    if (titleId) {
      const chatTitle = await this.chatService.findOneChat(titleId);
      if (!chatTitle || String(chatTitle.userId) !== userId) {
        throw new NotFoundException('chat title not found');
      }
      documentId = String(chatTitle.documentId ?? '').trim();
      if (!documentId) {
        throw new BadRequestException('documentId not found for title');
      }
    } else {
      documentId = clientMessageId || randomUUID();
    }

    const modelCode = String(dto.modelCode ?? '').trim();
    const model = await this.aiModelRepo.findOne({
      where: { modelCode, enabled: 1 },
      order: { sort: 'ASC' },
    });
    if (!model) {
      throw new NotFoundException('模型不存在或未启用');
    }

    const filteredParams = await this.paramFilter.filter(
      model.id,
      dto.params as Record<string, unknown> | undefined,
    );

    return {
      userId,
      titleId,
      documentId,
      model,
      filteredParams,
    };
  }

  async saveUserMessage(
    dto: SendChatDto,
    ctx: ChatSendContext,
    apiKey: string,
    baseURL: string,
    resolvedModel: string,
  ): Promise<void> {
    const { content, attachments } = assertSendChatPayload(dto);

    if (!ctx.titleId) {
      const title = await this.generateChatTitle(
        content,
        attachments,
        apiKey,
        baseURL,
        resolvedModel,
      );
      const saved = await this.chatService.addNewTitle(
        new ChatEntity({
          userId: ctx.userId,
          documentId: ctx.documentId,
          title,
        }),
      );
      const newTitleId =
        String(saved?._id ?? saved?.id ?? '').trim() || undefined;
      ctx.createdTitleId = newTitleId;
      if (newTitleId) ctx.titleId = newTitleId;
    } else {
      await this.chatService.updateChatTitle(ctx.titleId);
    }

    if (content) {
      await this.chatService.addNewContent({
        role: 'user',
        content,
        useModel: resolvedModel,
        documentId: ctx.documentId,
        type: 'input_text',
      });
    }

    for (const attachment of attachments) {
      const saved = await this.chatService.addNewContent(
        attachmentToContentEntity(attachment, ctx.documentId, resolvedModel),
      );
      const messageId = String(saved?._id ?? saved?.id ?? '').trim();
      const fileId = parsePositiveIntId(attachment.id);
      if (messageId && fileId) {
        await this.messageAttachmentService.linkFilesToMessage({
          messageId,
          fileIds: [fileId],
          role: 'user',
          userId: ctx.userId,
          markFileUsed: true,
        });
      }
    }
  }

  private async generateChatTitle(
    content: string,
    attachments: ReturnType<typeof assertSendChatPayload>['attachments'],
    apiKey: string,
    baseURL: string,
    resolvedModel: string,
  ): Promise<string> {
    let title = titleSeedFromPayload(content, attachments);
    if (!content) return title;
    try {
      const openai = new OpenAI({ apiKey, baseURL });
      const titleResponse = await openai.chat.completions.create({
        model: resolvedModel,
        messages: [
          {
            role: 'system',
            content:
              '你是一个标题生成助手。请根据用户输入生成一个简短标题，只返回标题文本本身，不要包含引号、序号、解释或换行。',
          },
          { role: 'user', content },
        ],
        stream: false,
      });
      const generated = String(
        titleResponse.choices?.[0]?.message?.content ?? '',
      ).trim();
      if (generated) title = generated;
    } catch {
      // 标题生成失败时使用截断内容
    }
    return title;
  }

  async buildOpenAIMessages(
    openai: OpenAI,
    ctx: ChatSendContext,
  ): Promise<OpenAI.ChatCompletionMessageParam[]> {
    const merged = await this.messageAssembly.buildMessagesFromHistory(
      openai,
      ctx.userId,
      ctx.documentId,
    );
    if (merged.length === 0) {
      throw new BadRequestException('messages is empty');
    }
    return this.messageAssembly.toOpenAIChatMessages(merged);
  }

  resolveProviderClient(ctx: ChatSendContext) {
    this.aiService.resolveAdapter(ctx.model.provider);
    return this.providerClient.resolveFromProvider(
      ctx.model.provider,
      ctx.model.apiModelName,
    );
  }

  buildCompletionBody(
    model: string,
    messages: OpenAI.ChatCompletionMessageParam[],
    filteredParams: Record<string, unknown>,
    stream: boolean,
  ): OpenAI.ChatCompletionCreateParams {
    const { stream: _s, messages: _m, model: _model, ...safeParams } =
      filteredParams;
    if (stream) {
      return {
        model,
        messages,
        ...safeParams,
        stream: true,
        stream_options: { include_usage: true },
      };
    }
    return {
      model,
      messages,
      ...safeParams,
      stream: false,
    };
  }

  async saveAssistantMessage(
    content: string,
    ctx: ChatSendContext,
    modelName: string,
  ): Promise<void> {
    await this.saveAssistantByDocumentId(content, modelName, ctx.documentId);
  }

  async saveAssistantByDocumentId(
    content: string,
    modelName: string,
    documentId: string,
  ): Promise<void> {
    await this.chatService.addNewContent({
      role: 'assistant',
      content,
      useModel: modelName,
      documentId,
    });
  }

  async completeOnce(
    dto: SendChatDto,
    userId: string,
    usageOut?: StreamCompletionUsageOut,
  ): Promise<{
    content: string;
    documentId: string;
    titleId: string;
    clientMessageId?: string;
    model: string;
    provider: string;
  }> {
    const ctx = await this.prepareContext(dto, userId);
    const { openai, apiKey, baseURL, model } =
      await this.resolveProviderClient(ctx);

    await this.saveUserMessage(dto, ctx, apiKey, baseURL, model);
    const messages = await this.buildOpenAIMessages(openai, ctx);
    const body = this.buildCompletionBody(
      model,
      messages,
      ctx.filteredParams,
      false,
    );

    const response = (await openai.chat.completions.create(
      body,
    )) as OpenAI.ChatCompletion;
    const content = String(
      response.choices?.[0]?.message?.content ?? '',
    ).trim();

    if (usageOut && response.usage) {
      usageOut.usage = {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      };
    }

    if (content) {
      await this.saveAssistantMessage(content, ctx, response.model ?? model);
    }

    return {
      content,
      documentId: ctx.documentId,
      titleId: ctx.createdTitleId ?? ctx.titleId,
      clientMessageId: dto.clientMessageId,
      model: response.model ?? model,
      provider: ctx.model.provider,
    };
  }
}
