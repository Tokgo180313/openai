import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLogModule } from 'src/common/operation-log/operation-log.module';
import { ProviderModule } from 'src/provider/provider.module';
import { AiModel } from './entities/ai-model.entity';
import { AiModelsController } from './ai-models.controller';
import { AiModelsService } from './ai-models.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiModel]),
    ProviderModule,
    OperationLogModule,
  ],
  controllers: [AiModelsController],
  providers: [AiModelsService],
  exports: [AiModelsService],
})
export class AiModelsModule {}
