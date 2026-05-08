import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AiModelConfig,
  AiModelConfigSchema,
} from 'src/schemas/aiModelConfig/aiModelConfig.schema';
import { AiModelConfigController } from './aiModelConfig.controller';
import { AiModelConfigService } from './aiModelConfig.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiModelConfig.name, schema: AiModelConfigSchema },
    ]),
  ],
  controllers: [AiModelConfigController],
  providers: [AiModelConfigService],
  exports: [AiModelConfigService],
})
export class AiModelConfigModule {}
