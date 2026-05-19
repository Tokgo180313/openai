import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { MenuDto } from './dto/menu.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('menu')
@Controller('/menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /** 当前登录用户可见菜单树（按 RBAC） */
  @Get('/my')
  async myMenus(@CurrentUser('id') userId: string) {
    return this.menuService.findMyMenuTree(userId);
  }

  /** 全量菜单树（管理端配置用，需具备菜单管理权限时由前端控制入口） */
  @Post('/tree')
  async menuTree() {
    return this.menuService.findMenuTree();
  }

  @Post('/findMenuList')
  async findMenuList(@Body() menuDto: MenuDto) {
    return this.menuService.findAllMenus(menuDto);
  }
}
