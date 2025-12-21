import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ConfigModule } from '@nestjs/config';
import { Content, ContentSchema } from 'src/schemas/content/content.schema';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Content.name, schema: ContentSchema }]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
