import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModel } from 'src/ai-models/entities/ai-model.entity';
import { AiModelParamWhitelist } from 'src/white-list/entities/ai-model-param-whitelist.entity';
import { Content, ContentSchema } from 'src/schemas/content/content.schema';
import { ChatTitle, ChatTitleSchema } from 'src/schemas/chat/chat.schema';
import { ChatModule } from 'src/chat/chat.module';
import { ProviderModule } from 'src/provider/provider.module';
import { UsageModule } from 'src/usage/usage.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
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
import { MessagesValidator } from './validators/messages.validator';
import { ImageValidator } from './validators/image.validator';
import { ParameterWhitelistValidator } from './validators/parameter-whitelist.validator';
import { ProviderClientService } from './services/provider-client.service';
import { MessageAssemblyService } from './services/message-assembly.service';
import { AiStreamService } from './services/ai-stream.service';
import { AiChatCompletionService } from './services/ai-chat-completion.service';
import { AiChatSendService } from './services/ai-chat-send.service';
import { ParamFilterService } from './services/param-filter.service';
import { MessageAttachmentModule } from 'src/message-attachments/message-attachment.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule,
    TypeOrmModule.forFeature([AiModel, AiModelParamWhitelist]),
    MessageAttachmentModule,
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: ChatTitle.name, schema: ChatTitleSchema },
    ]),
    forwardRef(() => ChatModule),
    ProviderModule,
    UsageModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    ProviderClientService,
    MessageAssemblyService,
    AiStreamService,
    AiChatSendService,
    ParamFilterService,
    AiChatCompletionService,
    ChatHandler,
    ReasoningHandler,
    ImageGenerationHandler,
    ImageEditHandler,
    MultimodalHandler,
    FileHandler,
    AudioHandler,
    EmbeddingHandler,
    OpenAiAdapter,
    DeepseekAdapter,
    LinkfoxAdapter,
    MessagesValidator,
    ImageValidator,
    ParameterWhitelistValidator,
  ],
  exports: [
    AiService,
    AiStreamService,
    AiChatSendService,
    ParamFilterService,
    AiChatCompletionService,
    ProviderClientService,
    MessageAssemblyService,
  ],
})
export class AiModule {}
