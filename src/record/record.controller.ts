import { Body, Controller, Delete, Post, Query, UseGuards } from '@nestjs/common';
import { RecordService } from './record.service';
import { RecordDto } from './dto/record.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('record')
@Controller('/record')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post('/findRecordList')
  @UseGuards(JwtAuthGuard)
  async findRecordList(
    @Body() recordDto: RecordDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.recordService.findRecordList(recordDto, userId);
  }

  @Delete('/deleteById')
  async removeRecord(@Query('id') id: string) {
    return this.recordService.deleteRecord(id);
  }
}
