import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLogModule } from 'src/common/operation-log/operation-log.module';
import { ModelService } from './models.service';
import { ModelController } from './models.controller';
import { ModelRecord } from './entities/model-record.entity';
import { KeyModule } from 'src/key/key.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModelRecord]),
    KeyModule,
    OperationLogModule,
  ],
  controllers: [ModelController],
  providers: [ModelService],
  exports: [ModelService],
})
export class ModelsModule {}
