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
import { AiModelsService } from './ai-models.service';
import {
  AiModelCreateDto,
  AiModelQueryDto,
  AiModelUpdateDto,
} from './dto/ai-models.dto';

@ApiTags('ai-models')
@Controller('/ai-model')
@UseGuards(JwtAuthGuard)
export class AiModelsController {
  constructor(
    private readonly aiModelsService: AiModelsService,
    private readonly operationLog: OperationLogService,
  ) {}

  @Put('/add')
  async add(
    @Body() dto: AiModelCreateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.aiModelsService.create(dto);
    await this.operationLog.append(operatorId, 'AI模型添加', String(row.id));
    return row;
  }

  @Put('/update')
  async update(
    @Body() dto: AiModelUpdateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.aiModelsService.update(dto);
    await this.operationLog.append(operatorId, 'AI模型编辑', String(row.id));
    return row;
  }

  @Post('/findAiModelList')
  async findAiModelList(@Body() dto: AiModelQueryDto) {
    return await this.aiModelsService.findList(dto);
  }

  @Get('/findById')
  async findById(@Query('id') id: string) {
    return await this.aiModelsService.findById(id);
  }

  @Delete('/deleteById')
  async deleteById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.aiModelsService.deleteById(id);
    await this.operationLog.append(operatorId, 'AI模型删除', id);
  }

  @Put('/disableById')
  async disableById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.aiModelsService.disableById(id);
    await this.operationLog.append(operatorId, 'AI模型禁用', id);
  }

  @Put('/enableById')
  async enableById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.aiModelsService.enableById(id);
    await this.operationLog.append(operatorId, 'AI模型启用', id);
  }

  @Get('/findProviderList')
  async findProviderList() {
    return await this.aiModelsService.findProviderList();
  }

  @Get('/syncOpenAIModels')
  async syncOpenAIModels(@Query('provider') provider: string) {
    return await this.aiModelsService.syncOpenAIModelsByProvider(provider);
  }
}
