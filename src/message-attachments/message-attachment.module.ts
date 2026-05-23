import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UploadFile } from 'src/upload-file/entities/upload-file.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
import { MessageAttachmentController } from './message-attachment.controller';
import { MessageAttachmentService } from './message-attachment.service';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([MessageAttachment, UploadFile]),
  ],
  controllers: [MessageAttachmentController],
  providers: [MessageAttachmentService],
  exports: [MessageAttachmentService],
})
export class MessageAttachmentModule {}
