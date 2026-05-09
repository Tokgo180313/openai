import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OperationLogService } from 'src/common/operation-log/operation-log.service';
import { KeyService } from './key.service';
import { KeyDto, KeyQueryDto, KeyUpdateDto } from './dto/key.dto';

@ApiTags('key')
@Controller('/key')
@UseGuards(JwtAuthGuard)
export class KeyController {
  constructor(
    private readonly keyService: KeyService,
    private readonly operationLog: OperationLogService,
  ) {}

  @Put('/add')
  async addKey(@Body() dto: KeyDto, @CurrentUser('id') operatorId: string) {
    const row = await this.keyService.createKey(dto);
    await this.operationLog.append(operatorId, 'API密钥添加', String(row.id));
    return row;
  }

  @Post('/findKeyList')
  async findKeyList(
    @Body() dto: KeyQueryDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const list = await this.keyService.findKeyList(dto);
    await this.operationLog.append(operatorId, 'API密钥列表查询');
    return list;
  }

  @Get('/findById')
  async findById(@Query('id') id: string) {
    return await this.keyService.findKeyById(id);
  }

  @Get('/findKeyByModelClassify')
  async findKeyByModelClassify(
    @Query('modelClassify') modelClassify: string,
  ) {
    return await this.keyService.findKeyByModelClassify(modelClassify);
  }

  @Delete('/deleteById')
  async deleteById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.keyService.deleteKeyById(id);
    await this.operationLog.append(operatorId, 'API密钥删除', id);
  }

  @Put('/updateById')
  async updateById(
    @Query('id') id: string,
    @Body() dto: KeyUpdateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.keyService.updateKeyById(id, dto);
    await this.operationLog.append(operatorId, 'API密钥修改', id);
    return row;
  }
}
