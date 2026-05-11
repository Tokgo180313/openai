import { Body, Controller, Post, Put, Query, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateRoleDto, RoleDto } from './dto/role.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OperationLogService } from 'src/common/operation-log/operation-log.service';

@ApiTags('role')
@Controller('/role')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly operationLog: OperationLogService,
  ) {}

  @Put('/add')
  async createRole(
    @Body() roleDto: CreateRoleDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.roleService.createRole(roleDto);
    await this.operationLog.append(operatorId, '角色添加', String(row.id));
    return row;
  }

  @Post('/findRoleList')
  async findRoleList(@Body() roleDto: RoleDto) {
    return await this.roleService.findRoleList(roleDto);
  }

  @Post('/stop')
  async stopRole(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.roleService.stopRole(id);
    await this.operationLog.append(operatorId, '角色停用', id);
  }

  @Post('/start')
  async startRole(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    await this.roleService.startRole(id);
    await this.operationLog.append(operatorId, '角色启用', id);
  }
}
