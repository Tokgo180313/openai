import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatTitle, ChatTitleSchema } from 'src/schemas/chat/chat.schema';
import { ContentSchema,Content } from 'src/schemas/content/content.schema';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from 'src/chat/chat.module';
import { UsageModule } from 'src/usage/usage.module';
import { ModelsModule } from 'src/models/models.module';
@Module({
  imports: [
    ConfigModule,
    JwtModule,
    ChatModule,
    UsageModule,
    ModelsModule,
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: ChatTitle.name, schema: ChatTitleSchema },
    ]),
  ],
  controllers:[StreamController],
  providers:[StreamService],
  exports:[StreamService]
})
export class StreamModule {}
