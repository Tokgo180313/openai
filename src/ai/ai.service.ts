import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModel } from 'src/ai-models/entities/ai-model.entity';
import type { AiRequestDto } from './dto/ai-request.dto';
import type { AiResponseDto } from './dto/ai-response.dto';
import type { AiHandler } from './interfaces/ai-handler.interface';
import type { AiAdapter } from './interfaces/ai-adapter.interface';
import { ChatHandler } from './handlers/chat.handler';
import { ReasoningHandler } from './handlers/reasoning.handler';
import { ImageGenerationHandler } from './handlers/image-generation.handler';
import { ImageEditHandler } from './handlers/image-edit.handler';
import { MultimodalHandler } from './handlers/multimodal.handler';
import { FileHandler } from './handlers/file.handler';
import { AudioHandler } from './handlers/audio.handler';
import { EmbeddingHandler } from './handlers/embedding.handler';
import { OpenAiAdapter } from './adapters/openai.adapter';
import { DeepseekAdapter } from './adapters/deepseek.adapter';
import { LinkfoxAdapter } from './adapters/linkfox.adapter';

@Injectable()
export class AiService {
  private readonly handlers: AiHandler[];
  private readonly adapters: AiAdapter[];

  constructor(
    @InjectRepository(AiModel)
    private readonly aiModelRepo: Repository<AiModel>,
    chatHandler: ChatHandler,
    reasoningHandler: ReasoningHandler,
    imageGenerationHandler: ImageGenerationHandler,
    imageEditHandler: ImageEditHandler,
    multimodalHandler: MultimodalHandler,
    fileHandler: FileHandler,
    audioHandler: AudioHandler,
    embeddingHandler: EmbeddingHandler,
    openAiAdapter: OpenAiAdapter,
    deepseekAdapter: DeepseekAdapter,
    linkfoxAdapter: LinkfoxAdapter,
  ) {
    this.handlers = [
      chatHandler,
      reasoningHandler,
      imageGenerationHandler,
      imageEditHandler,
      multimodalHandler,
      fileHandler,
      audioHandler,
      embeddingHandler,
    ];
    this.adapters = [openAiAdapter, deepseekAdapter, linkfoxAdapter];
  }

  resolveAdapter(provider: string): AiAdapter {
    const normalized = String(provider ?? '').trim().toLowerCase();
    const adapter = this.adapters.find(
      (a) => String(a.provider).toLowerCase() === normalized,
    );
    if (!adapter) {
      throw new BadRequestException(`unsupported provider: ${provider}`);
    }
    return adapter;
  }

  resolveHandler(modelType: string): AiHandler {
    const handler = this.handlers.find((h) => h.supports(modelType));
    if (!handler) {
      throw new BadRequestException(`unsupported modelType: ${modelType}`);
    }
    return handler;
  }

  async invoke(
    request: AiRequestDto,
    userId: string,
    token?: string,
  ): Promise<AiResponseDto> {
    const model = await this.aiModelRepo.findOne({
      where: {
        provider: String(request.provider).trim().toLowerCase(),
        apiModelName: request.apiModelName,
        enabled: 1,
      },
    });
    if (!model) {
      throw new NotFoundException('模型不存在或未启用');
    }

    const modelType = request.modelType || model.modelType;
    const handler = this.resolveHandler(modelType);
    const adapter = this.resolveAdapter(request.provider);

    await adapter.adaptRequest({
      provider: request.provider,
      apiModelName: model.apiModelName,
      baseUrl: request.baseUrl ?? model.baseUrl ?? undefined,
      body: request.payload,
    });

    return handler.handle(request, {
      userId,
      provider: model.provider,
      modelType,
      token,
    });
  }
}
