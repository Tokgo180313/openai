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
import { ParamWhitelistService } from './param-whitelist.service';
import {
  ParamWhitelistCreateDto,
  ParamWhitelistQueryDto,
  ParamWhitelistUpdateDto,
} from './dto/param-whitelist.dto';

@ApiTags('param-whitelist')
@Controller('/white-list')
@UseGuards(JwtAuthGuard)
export class ParamWhitelistController {
  constructor(
    private readonly paramWhitelistService: ParamWhitelistService,
    private readonly operationLog: OperationLogService,
  ) {}

  @Put('/add')
  async add(
    @Body() dto: ParamWhitelistCreateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.paramWhitelistService.create(dto);
    await this.operationLog.append(
      operatorId,
      '参数白名单添加',
      String(row.id),
    );
    return row;
  }

  @Put('/update')
  async update(
    @Body() dto: ParamWhitelistUpdateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.paramWhitelistService.update(dto);
    await this.operationLog.append(
      operatorId,
      '参数白名单编辑',
      String(row.id),
    );
    return row;
  }

  @Post('/findList')
  async findList(@Body() dto: ParamWhitelistQueryDto) {
    return await this.paramWhitelistService.findList(dto);
  }

  @Get('/findById')
  async findById(@Query('id') id: string) {
    return await this.paramWhitelistService.findById(id);
  }

  @Get('/findByModelId')
  async findByModelId(@Query('modelId') modelId: string) {
    return await this.paramWhitelistService.findByModelId(modelId);
  }

  @Get('/findTreeByModelId')
  async findTreeByModelId(@Query('modelId') modelId: string) {
    return await this.paramWhitelistService.findTreeByModelId(modelId);
  }

  @Get('/findEnabledTreeByModelId')
  async findEnabledTreeByModelId(@Query('modelId') modelId: string) {
    return await this.paramWhitelistService.findEnabledTreeByModelId(modelId);
  }

  @Delete('/deleteById')
  async deleteById(
    @Query('id') id: string,
    @Query('cascade') cascade: string | undefined,
    @CurrentUser('id') operatorId: string,
  ) {
    if (cascade === '1' || cascade === 'true') {
      await this.paramWhitelistService.deleteByIdCascade(id);
    } else {
      await this.paramWhitelistService.deleteById(id);
    }
    await this.operationLog.append(operatorId, '参数白名单删除', id);
  }

  @Put('/disableById')
  async disableById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.paramWhitelistService.disableById(id);
    await this.operationLog.append(operatorId, '参数白名单禁用', id);
    return row;
  }

  @Put('/enableById')
  async enableById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.paramWhitelistService.enableById(id);
    await this.operationLog.append(operatorId, '参数白名单启用', id);
    return row;
  }
}
