import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageDto } from './dto/MessageDto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/deepseek')
  async chatByDeepSeek(@Body() messageDto: MessageDto) {
    if (messageDto) {
      return await this.chatService.completionFunction(
        messageDto.id,
        messageDto.question,
        messageDto.list
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
}
