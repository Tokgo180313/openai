import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiModelConfigService } from './aiModelConfig.service';
import {
  AiModelConfigCreateDto,
  AiModelConfigQueryDto,
  AiModelConfigUpdateDto,
} from './dto/aiModelConfig.dto';

@ApiTags('aiModelConfig')
@Controller('/aiModelConfig')
export class AiModelConfigController {
  constructor(private readonly aiModelConfigService: AiModelConfigService) {}

  @Put('/add')
  async add(@Body() dto: AiModelConfigCreateDto) {
    return await this.aiModelConfigService.create(dto);
  }

  @Post('/findAiModelConfigList')
  async findAiModelConfigList(@Body() dto: AiModelConfigQueryDto) {
    return await this.aiModelConfigService.findList(dto);
  }

  @Get('/findById')
  async findById(@Query('id') id: string) {
    return await this.aiModelConfigService.findById(id);
  }

  @Delete('/deleteById')
  async deleteById(@Query('id') id: string) {
    await this.aiModelConfigService.deleteById(id);
  }

  @Put('/updateById')
  async updateById(
    @Query('id') id: string,
    @Body() dto: AiModelConfigUpdateDto,
  ) {
    return await this.aiModelConfigService.updateById(id, dto);
  }
}
