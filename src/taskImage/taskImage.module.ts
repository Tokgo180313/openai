import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { TaskImageHistory } from './entities/task-image-history.entity';
import { TaskImageController } from './taskImage.controller';
import { TaskImageService } from './taskImage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskImageHistory]),
    AuthModule,
  ],
  controllers: [TaskImageController],
  providers: [TaskImageService],
  exports: [TaskImageService],
})
export class TaskImageModule {}
