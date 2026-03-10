import { Module } from '@nestjs/common';
import { ApiKeyService } from './apiKey.service';
import { ApiKeyController } from './apiKey.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKey,ApiKeySchema } from 'src/schemas/apiKey/apiKey.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name:ApiKey.name, schema: ApiKeySchema }]),
  ],
  controllers: [ApiKeyController],
  providers: [ApiKeyService],
  exports: [ApiKeyService],
}) 
export class ApiKeyModule {}
