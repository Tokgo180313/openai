import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordService } from './record.service';
import { RecordController } from './record.controller';
import { OperationRecord } from './entities/operation-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OperationRecord])],
  controllers: [RecordController],
  providers: [RecordService],
  exports: [RecordService],
})
export class RecordModule {}