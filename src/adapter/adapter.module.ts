import { Module } from '@nestjs/common';
import { RequestParamAdapterService } from './request-param.adapter';

@Module({
  providers: [RequestParamAdapterService],
  exports: [RequestParamAdapterService],
})
export class AdapterModule {}
