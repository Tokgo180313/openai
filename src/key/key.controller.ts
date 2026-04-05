import { Body, Controller, Delete, Get, Put, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KeyService } from './key.service';
import { KeyDto, KeyQueryDto, KeyUpdateDto } from './dto/key.dto';

@ApiTags('key')
@Controller('/key')
export class KeyController {
  constructor(private readonly keyService: KeyService) {}

  // 增
  @Put('/add')
  async addKey(@Body() dto: KeyDto) {
    return await this.keyService.createKey(dto);
  }

  // 查：列表（可按 modelClassify / baseURL 过滤）
  @Post('/findKeyList')
  async findKeyList(@Body() dto: KeyQueryDto) {
    return await this.keyService.findKeyList(dto);
  }

  // 查：单条
  @Get('/findById')
  async findById(@Query('id') id: string) {
    return await this.keyService.findKeyById(id);
  }

  // 查：根据 modelClassify 查单条
  @Get('/findKeyByModelClassify')
  async findKeyByModelClassify(@Query('modelClassify') modelClassify: string) {
    return await this.keyService.findKeyByModelClassify(modelClassify);
  }

  // 删
  @Delete('/deleteById')
  async deleteById(@Query('id') id: string) {
    return await this.keyService.deleteKeyById(id);
  }

  // 改
  @Put('/updateById')
  async updateById(@Query('id') id: string, @Body() dto: KeyUpdateDto) {
    return await this.keyService.updateKeyById(id, dto);
  }
}

