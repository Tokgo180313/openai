import { Module } from '@nestjs/common';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Usage, UsageSchema } from 'src/schemas/usage/usage.schema';
import { RecordModule } from 'src/record/record.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usage.name, schema: UsageSchema }]),
    RecordModule,
    UserModule,
  ],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
