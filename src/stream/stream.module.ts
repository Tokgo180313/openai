import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { ConfigModule } from '@nestjs/config';
import { KeyModule } from 'src/key/key.module';

@Module({
  imports: [ConfigModule, JwtModule, KeyModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
