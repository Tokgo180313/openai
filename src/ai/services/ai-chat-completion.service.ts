import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageDto } from 'src/chat/dto/MessageDto';
import { ChatEntity } from 'src/chat/entity/Chat.entity';
import {
  Content,
  ContentDocument,
} from 'src/schemas/content/content.schema';
import {
  ChatTitle,
  ChatTitleDocument,
} from 'src/schemas/chat/chat.schema';
import { UsageService } from 'src/usage/usage.service';
import { UsageEntity } from 'src/usage/entity/usage.entity';
import { ProviderClientService } from './provider-client.service';

@Injectable()
export class AiChatCompletionService {
  constructor(
    @InjectModel(Content.name) private contentSchema: Model<ContentDocument>,
    @InjectModel(ChatTitle.name)
    private chatTitleSchema: Model<ChatTitleDocument>,
    private readonly jwtService: JwtService,
    private readonly usageService: UsageService,
    private readonly providerClient: ProviderClientService,
  ) {}

  async chatByChatgpt(messageDto: MessageDto, token: string) {
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

      const normalizeRole = (
        role: string | undefined,
      ): 'system' | 'assistant' | 'user' => {
        const r = String(role ?? '').trim().toLowerCase();
        if (r === 'system') return 'system';
        if (r === 'assistant') return 'assistant';
        return 'user';
      };

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

        if (
          messagesList.length === 0 ||
          String(messagesList[messagesList.length - 1]?.content ?? '').trim() !==
            questionContent
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

      const model = String(question?.useModel ?? '').trim() || 'gpt-4o-mini';
      const provider =
        String(question?.provider ?? '').trim().toLowerCase() || 'openai';
      const { openai } = this.providerClient.resolveFromEnv(model);

      const response = await openai.chat.completions.create({
        model,
        messages: messagesList,
      });

      const responseText = String(
        response?.choices?.[0]?.message?.content ?? '',
      ).trim();
      const responseRole = (response?.choices?.[0]?.message?.role ??
        'assistant') as OpenAI.ChatCompletionMessageParam['role'];

      await new this.contentSchema({
        documentId,
        useModel: model,
        role: normalizeRole(question?.role),
        content: questionContent,
      }).save();

      await new this.contentSchema({
        documentId,
        useModel: response.model ?? model,
        role: responseRole,
        content: responseText,
      }).save();

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'my-secret-key',
      });
      const userId = payload.sub;

      const titleId = last?.titleId ? String(last.titleId).trim() : '';
      if (titleId) {
        await this.chatTitleSchema
          .updateOne({ _id: titleId }, { $set: { updatedAt: new Date() } })
          .exec();
      } else {
        await new this.chatTitleSchema(
          new ChatEntity({
            userId,
            documentId,
            title: questionContent,
          }),
        ).save();
      }

      if (response.usage) {
        const usageEntity: UsageEntity = {
          modelName: response.model ?? model,
          provider,
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
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException(
        error?.message || 'Failed to chat with ChatGPT',
      );
    }
  }

  /** 供 AiRequestDto 统一入口：payload 为 MessageDto 数组 */
  async chatFromPayload(
    payload: Record<string, unknown>,
    token: string,
  ) {
    return this.chatByChatgpt(payload as unknown as MessageDto, token);
  }
}
