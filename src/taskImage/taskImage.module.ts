import { Module } from '@nestjs/common';
import { TaskImageController } from './taskImage.controller';
import { TaskImageService } from './taskImage.service';

@Module({
  controllers: [TaskImageController],
  providers: [TaskImageService],
  exports: [TaskImageService],
})
export class TaskImageModule {}
