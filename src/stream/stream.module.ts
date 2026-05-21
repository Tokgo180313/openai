import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { ConfigModule } from '@nestjs/config';
import { ProviderModule } from 'src/provider/provider.module';
import { ChatModule } from 'src/chat/chat.module';
import { UsageModule } from 'src/usage/usage.module';

@Module({
  imports: [ConfigModule, JwtModule, ProviderModule, ChatModule, UsageModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
