import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLogModule } from 'src/common/operation-log/operation-log.module';
import { AiModel } from 'src/ai-models/entities/ai-model.entity';
import { AiModelParamWhitelist } from './entities/ai-model-param-whitelist.entity';
import { ParamWhitelistController } from './param-whitelist.controller';
import { ParamWhitelistService } from './param-whitelist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiModelParamWhitelist, AiModel]),
    OperationLogModule,
  ],
  controllers: [ParamWhitelistController],
  providers: [ParamWhitelistService],
  exports: [ParamWhitelistService],
})
export class WhiteListModule {}
