import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLogModule } from 'src/common/operation-log/operation-log.module';
import { AiModelConfigEntity } from './entities/ai-model-config.entity';
import { AiModelConfigController } from './aiModelConfig.controller';
import { AiModelConfigService } from './aiModelConfig.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiModelConfigEntity]),
    OperationLogModule,
  ],
  controllers: [AiModelConfigController],
  providers: [AiModelConfigService],
  exports: [AiModelConfigService],
})
export class AiModelConfigModule {}
