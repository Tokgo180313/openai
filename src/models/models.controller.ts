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
import { UpdateModelDto } from './dto/update-model.dto';
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

  @Put('/update')
  async updateModel(
    @Body() dto: UpdateModelDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.modelService.updateModel(dto);
    await this.operationLog.append(operatorId, '模型编辑', String(row.id));
    return row;
  }

  @Post('/findModellist')
  async findModelList(@Body() modelDto: ModelsDto) {
    return await this.modelService.findModelList(modelDto);
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
  async findClassifyList() {
    return await this.modelService.findClassifyList();
  }

  @Get('/openaiModelList')
  async openaiModelList(@Query('modelClassify') modelClassify: string) {
    return await this.modelService.listOpenAIModelsByClassify(modelClassify);
  }
}
