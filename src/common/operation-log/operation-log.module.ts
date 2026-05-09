import { Module } from '@nestjs/common';
import { RecordModule } from 'src/record/record.module';
import { UserModule } from 'src/user/user.module';
import { OperationLogService } from './operation-log.service';

@Module({
  imports: [UserModule, RecordModule],
  providers: [OperationLogService],
  exports: [OperationLogService],
})
export class OperationLogModule {}
