import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  MessageAttachmentBatchCreateDto,
  MessageAttachmentQueryByMessageDto,
  MessageAttachmentUpdateDto,
} from './dto/message-attachment.dto';
import { MessageAttachmentService } from './message-attachment.service';

@ApiTags('message-attachment')
@Controller('/message-attachment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access_token')
export class MessageAttachmentController {
  constructor(
    private readonly messageAttachmentService: MessageAttachmentService,
  ) {}

  @Post('/batchCreate')
  async batchCreate(
    @Body() dto: MessageAttachmentBatchCreateDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.messageAttachmentService.batchCreate(dto, userId);
  }

  @Post('/findByMessageId')
  async findByMessageId(
    @Body() dto: MessageAttachmentQueryByMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.messageAttachmentService.findByMessageId(
      dto.messageId,
      userId,
    );
  }

  @Get('/findById')
  @ApiQuery({ name: 'id', required: true })
  async findById(
    @Query('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const attachmentId = this.parseQueryId(id);
    return await this.messageAttachmentService.findById(attachmentId, userId);
  }

  @Put('/update')
  async update(
    @Body() dto: MessageAttachmentUpdateDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.messageAttachmentService.update(dto, userId);
  }

  @Delete('/deleteById')
  @ApiQuery({ name: 'id', required: true })
  async deleteById(
    @Query('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const attachmentId = this.parseQueryId(id);
    await this.messageAttachmentService.deleteById(attachmentId, userId);
    return { ok: true };
  }

  @Delete('/deleteByMessageId')
  @ApiQuery({ name: 'messageId', required: true })
  async deleteByMessageId(
    @Query('messageId') messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.messageAttachmentService.deleteByMessageId(messageId, userId);
    return { ok: true };
  }

  private parseQueryId(raw: string): number {
    const id = Number(String(raw ?? '').trim());
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('invalid id');
    }
    return id;
  }
}
