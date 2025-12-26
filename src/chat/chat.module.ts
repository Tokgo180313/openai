import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ConfigModule } from '@nestjs/config';
import { Content, ContentSchema } from 'src/schemas/content/content.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatTitle, ChatTitleSchema } from 'src/schemas/chat/chat.schema';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    ConfigModule,
    JwtModule,
    MongooseModule.forFeature([{ name: Content.name, schema: ContentSchema },{name:ChatTitle.name,schema:ChatTitleSchema}]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
