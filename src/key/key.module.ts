import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KeyController } from './key.controller';
import { KeyService } from './key.service';
import { ApiKey, ApiKeySchema } from 'src/schemas/key/key.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }])],
  controllers: [KeyController],
  providers: [KeyService],
  exports: [KeyService],
})
export class KeyModule {}

