import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { UsageRecord } from './entities/usage-record.entity';
import { RecordModule } from 'src/record/record.module';
import { UserModule } from 'src/user/user.module';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsageRecord, User]),
    RecordModule,
    UserModule,
  ],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
