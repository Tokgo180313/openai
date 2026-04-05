import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule, JwtModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
