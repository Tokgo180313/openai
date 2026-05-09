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
import { ModelService } from './models.service';
import { ModelsDto } from './dto/models.dto';
import { ApiTags } from '@nestjs/swagger';
import { ModelsEntity } from './entity/models.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OperationLogService } from 'src/common/operation-log/operation-log.service';

@ApiTags('model')
@Controller('/model')
@UseGuards(JwtAuthGuard)
export class ModelController {
  constructor(
    private readonly modelService: ModelService,
    private readonly operationLog: OperationLogService,
  ) {}

  @Put('/add')
  async addModel(
    @Body() modelDto: ModelsEntity,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.modelService.createModel(modelDto);
    await this.operationLog.append(operatorId, '模型添加', String(row.id));
    return row;
  }

  @Post('/findModellist')
  async findModelList(
    @Body() modelDto: ModelsDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const result = await this.modelService.findModelList(modelDto);
    await this.operationLog.append(operatorId, '模型列表查询');
    return result;
  }

  @Get('/findById')
  async findById(@Query('id') id: string) {
    return await this.modelService.findModelById(id);
  }

  @Delete('/deleteById')
  async deleteById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.modelService.deleteModel(id);
    await this.operationLog.append(operatorId, '模型删除', id);
  }

  @Put('/disableById')
  async disableById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.modelService.disableModel(id);
    await this.operationLog.append(operatorId, '模型禁用', id);
  }

  @Put('/enableById')
  async enableById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.modelService.enableModel(id);
    await this.operationLog.append(operatorId, '模型启用', id);
  }

  @Get('/findClassifyList')
  async findClassifyList(@CurrentUser('id') operatorId: string) {
    const list = await this.modelService.findClassifyList();
    await this.operationLog.append(operatorId, '模型分类列表查询');
    return list;
  }

  @Get('/openaiModelList')
  async openaiModelList(
    @Query('modelClassify') modelClassify: string,
    @CurrentUser('id') operatorId: string,
  ) {
    const data =
      await this.modelService.listOpenAIModelsByClassify(modelClassify);
    await this.operationLog.append(
      operatorId,
      'OpenAI模型列表查询',
      modelClassify ?? '',
    );
    return data;
  }
}
