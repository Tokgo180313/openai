import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeyController } from './key.controller';
import { KeyService } from './key.service';
import { ApiKey } from './entities/api-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  controllers: [KeyController],
  providers: [KeyService],
  exports: [KeyService],
})
export class KeyModule {}

