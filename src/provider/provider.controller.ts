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
import { ProviderService } from './provider.service';
import { ProviderDto, ProviderQueryDto, ProviderUpdateDto } from './dto/provider.dto';

@ApiTags('provider')
@Controller('/provider')
@UseGuards(JwtAuthGuard)
export class ProviderController {
  constructor(
    private readonly providerService: ProviderService,
    private readonly operationLog: OperationLogService,
  ) {}

  @Put('/add')
  async add(@Body() dto: ProviderDto, @CurrentUser('id') operatorId: string) {
    const row = await this.providerService.create(dto);
    await this.operationLog.append(operatorId, 'API密钥添加', String(row.id));
    return row;
  }

  @Post('/findProviderList')
  async findProviderList(@Body() dto: ProviderQueryDto) {
    return await this.providerService.findProviderList(dto);
  }

  @Get('/findById')
  async findById(@Query('id') id: string) {
    return await this.providerService.findById(id);
  }

  @Get('/findByProvider')
  async findByProvider(@Query('provider') provider: string) {
    return await this.providerService.findByProvider(provider);
  }

  @Delete('/deleteById')
  async deleteById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.providerService.deleteById(id);
    await this.operationLog.append(operatorId, 'API密钥删除', id);
  }

  @Put('/updateById')
  async updateById(
    @Query('id') id: string,
    @Body() dto: ProviderUpdateDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.providerService.updateById(id, dto);
    await this.operationLog.append(operatorId, 'API密钥修改', id);
    return row;
  }
}
