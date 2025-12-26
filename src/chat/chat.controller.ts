import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageDto } from './dto/MessageDto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('chat')
@Controller('/chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/deepseek')
  async chatByDeepSeek(@Body() messageDto: MessageDto) {
    if (messageDto) {
      return await this.chatService.completionFunction(
        messageDto.id,
        messageDto.question,
        messageDto.list,
      );
    } else {
      return null;
    }
  }

  @Post('/chatgpt')
  async chatByChatgpt(@Body() messageDto: Array<MessageDto>) {
    if (messageDto) {
      console.log('chatgpt.com');
    }
    return null;
  }

  @Post('/list')
  async chatList(@Body() chatDto: ChatDto) {
    return this.chatService.chatList(chatDto);
  }

  @Get('/titleList')
  async chatTitleList() {
    console.log('title');
  }

  @Get('/info')
  async chatInfo(@Query('id') id: string) {
    return await this.chatService.chatInfo(id);
  }
}
