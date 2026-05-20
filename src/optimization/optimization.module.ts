import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLogModule } from 'src/common/operation-log/operation-log.module';
import { CopyOptimization } from './entities/copy-optimization.entity';
import { OptimizationController } from './optimization.controller';
import { OptimizationService } from './optimization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CopyOptimization]),
    OperationLogModule,
  ],
  controllers: [OptimizationController],
  providers: [OptimizationService],
  exports: [OptimizationService],
})
export class OptimizationModule {}
