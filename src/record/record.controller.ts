import { Body, Controller, Delete, Post, Query } from '@nestjs/common';
import { RecordService } from './record.service';
import { RecordDto } from './dto/record.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('record')
@Controller('/record')
export class RecordController {
    constructor(private readonly recordService: RecordService){}

    @Post("/findRecordList")
    async findRecordList(@Body() recordDto:RecordDto){
        return await this.recordService.findRecordList(recordDto)
    }

    @Delete("/deleteById")
    async removeRecord(@Query("id") id:string){
        return this.recordService.deleteRecord(id);
    }

}