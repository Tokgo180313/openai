import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { ConfigModule } from '@nestjs/config';
import { UsageModule } from 'src/usage/usage.module';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [ConfigModule, JwtModule, AiModule, UsageModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
