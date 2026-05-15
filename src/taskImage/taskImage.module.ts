import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { FileModule } from 'src/file/file.module';
import { UsageModule } from 'src/usage/usage.module';
import { KeyModule } from 'src/key/key.module';
import {
  TaskImage,
  TaskImageSchema,
} from 'src/schemas/task-image/task-image.schema';
import { TaskImageHistory } from './entities/task-image-history.entity';
import { TaskImageController } from './taskImage.controller';
import { TaskImageService } from './taskImage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskImageHistory]),
    MongooseModule.forFeature([
      { name: TaskImage.name, schema: TaskImageSchema },
    ]),
    AuthModule,
    FileModule,
    UsageModule,
    KeyModule,
  ],
  controllers: [TaskImageController],
  providers: [TaskImageService],
  exports: [TaskImageService],
})
export class TaskImageModule {}
