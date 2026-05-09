import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OperationLogService } from 'src/common/operation-log/operation-log.service';
import { AiModelConfigService } from './aiModelConfig.service';
import {
  AiModelConfigCreateDto,
  AiModelConfigQueryDto,
  AiModelConfigUpdateDto,
} from './dto/aiModelConfig.dto';

@ApiTags('aiModelConfig')
@Controller('/aiModelConfig')
@UseGuards(JwtAuthGuard)
export class AiModelConfigController {
  constructor(
    private readonly aiModelConfigService: AiModelConfigService,
    private readonly operationLog: OperationLogService,
  ) {}

  @Put('/add')
  async add(
    @Body() dto: AiModelConfigCreateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.aiModelConfigService.create(dto);
    await this.operationLog.append(operatorId, 'AI模型配置添加', String(row.id));
    return row;
  }

  @Post('/findAiModelConfigList')
  async findAiModelConfigList(
    @Body() dto: AiModelConfigQueryDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const list = await this.aiModelConfigService.findList(dto);
    await this.operationLog.append(operatorId, 'AI模型配置列表查询');
    return list;
  }

  @Get('/findById')
  async findById(@Query('id') id: string) {
    return await this.aiModelConfigService.findById(id);
  }

  @Delete('/deleteById')
  async deleteById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.aiModelConfigService.deleteById(id);
    await this.operationLog.append(operatorId, 'AI模型配置删除', id);
  }

  @Put('/updateById')
  async updateById(
    @Query('id') id: string,
    @Body() dto: AiModelConfigUpdateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.aiModelConfigService.updateById(id, dto);
    await this.operationLog.append(operatorId, 'AI模型配置修改', id);
    return row;
  }
}
