import {
  BadRequestException,
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
import { MenuService } from './menu.service';
import { CreateMenuDto, MenuDto, UpdateMenuDto } from './dto/menu.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OperationLogService } from 'src/common/operation-log/operation-log.service';
import { parsePositiveIntId } from 'src/common/utils/positive-int-id.util';

@ApiTags('menu')
@Controller('/menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly operationLog: OperationLogService,
  ) {}

  /** 当前登录用户可见菜单树（按 RBAC） */
  @Get('/my')
  async myMenus(@CurrentUser('id') userId: string) {
    return this.menuService.findMyMenuTree(userId);
  }

  /** 全量菜单树（管理端配置用） */
  @Post('/tree')
  async menuTree() {
    return this.menuService.findMenuTree();
  }

  @Post('/findMenuList')
  async findMenuList(
    @Body() menuDto: MenuDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.menuService.findMenuList(menuDto, userId);
  }

  @Put('/add')
  async addMenu(
    @Body() dto: CreateMenuDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.menuService.createMenu(dto);
    await this.operationLog.append(operatorId, '菜单添加', String(row.id));
    return row;
  }

  @Put('/update')
  async updateMenu(
    @Body() dto: UpdateMenuDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const row = await this.menuService.updateMenu(dto);
    await this.operationLog.append(operatorId, '菜单编辑', String(row.id));
    return row;
  }

  @Delete('/deleteById')
  async deleteById(
    @Query('id') id: string,
    @CurrentUser('id') operatorId: string,
  ) {
    const menuId = parsePositiveIntId(id);
    if (menuId == null) {
      throw new BadRequestException('无效的菜单 id');
    }
    await this.menuService.deleteMenu(menuId);
    await this.operationLog.append(operatorId, '菜单删除', String(menuId));
  }
}
