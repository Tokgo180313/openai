import { Module } from '@nestjs/common';
import { ModelService } from './model.service';
import { ModelController } from './model.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Model,ModelSchema } from 'src/schemas/model/model.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: Model.name, schema: ModelSchema }]) ],
  controllers: [ModelController],
  providers: [ModelService],
  exports: [ModelService],
})
export class ModelModule {}