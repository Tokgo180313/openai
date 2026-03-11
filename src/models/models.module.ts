import { Module } from '@nestjs/common';
import { ModelService } from './models.service';
import { ModelController } from './models.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Models, ModelSchema } from 'src/schemas/models/models.schema';
import { RecordModule } from 'src/record/record.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Models.name, schema: ModelSchema }]),
    RecordModule,
  ],
  controllers: [ModelController],
  providers: [ModelService],
  exports: [ModelService],
})
export class ModelsModule {}
