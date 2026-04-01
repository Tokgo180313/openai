import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  Get,
  UseGuards,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageDto } from './dto/MessageDto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Token } from 'src/common/decorators/token.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
@ApiTags('chat')
@Controller('/chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/deepseek')
  async chatByDeepSeek(@Body() messageDto: MessageDto, @Token() token: string) {
    if (messageDto) {
      return await this.chatService.completionFunction(
        messageDto.id,
        messageDto.titleId,
        messageDto.question,
        messageDto.list,
        token,
      );
    } else {
      return null;
    }
  }

  @Post('/chatgpt')
  async chatByChatgpt(
    @Body() messageDto: Array<MessageDto>,
    @Token() token: string,
  ) {
    return await this.chatService.chatByChatgpt(messageDto, token);
  }
  @Post('/gemini')
  async chatByGemini(@Body() messageDto: MessageDto,@Token() token: string,@CurrentUser('id') userId:string) {
    const message = await this.chatService.generateText(messageDto?.question.content,userId);
    return { success: true, data: message };
  }

  @Get('/chatList/:id')
  async chatList(@Param('id') id: string) {
    return this.chatService.chatList(id);
  }

  @Get('/titleList')
  async chatTitleList(@Token() token: string) {
    return await this.chatService.chatTitleList(token);
  }

  @Post('/addChatTitle')
  async addChatTitle(@Body() chatDto: ChatDto, @Token() token: string) {
    return await this.chatService.addChatTitle(chatDto, token);
  }

  @Get('/info')
  async chatInfo(@Query('id') id: string) {
    return await this.chatService.chatInfo(id);
  }

  @Delete('/deleteChatTitle')
  async deleteChatTitle(@Query('titleId') titleId: string,@CurrentUser('id') userId:string) {
    try {
      return await this.chatService.deleteChatTitleById(titleId,userId);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
