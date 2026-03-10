import { Module } from '@nestjs/common';
import { ModelService } from './models.service';
import { ModelController } from './models.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Models,ModelSchema } from 'src/schemas/models/models.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: Models.name, schema: ModelSchema }]) ],
  controllers: [ModelController],
  providers: [ModelService],
  exports: [ModelService],
})
export class ModelsModule {}