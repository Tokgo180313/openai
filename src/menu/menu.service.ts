import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import {
  CreateMenuDto,
  MenuDto,
  MenuTreeNode,
  UpdateMenuDto,
} from './dto/menu.dto';
import { RbacService } from 'src/rbac/rbac.service';
import { RoleMenu } from 'src/rbac/entities/role-menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    @InjectRepository(RoleMenu)
    private readonly roleMenuRepo: Repository<RoleMenu>,
    private readonly rbacService: RbacService,
  ) {}

  async findAllMenus(menuDto?: MenuDto): Promise<Menu[]> {
    const qb = this.menuRepo
      .createQueryBuilder('m')
      .orderBy('m.sort', 'ASC')
      .addOrderBy('m.id', 'ASC');
    if (menuDto?.status && menuDto.status !== '') {
      qb.andWhere('m.status = :status', { status: menuDto.status });
    }
    if (menuDto?.name && menuDto.name !== '') {
      qb.andWhere('m.name LIKE :name', { name: `%${menuDto.name}%` });
    }
    return qb.getMany();
  }

  async findMenuTree(): Promise<MenuTreeNode[]> {
    const menus = await this.findAllMenus({ status: '1' });
    const flat: MenuTreeNode[] = menus.map((m) => this.toTreeNode(m));
    return this.buildTree(flat);
  }

  async findMyMenuTree(userId: string): Promise<MenuTreeNode[]> {
    return this.rbacService.getUserMenuTree(userId);
  }

  async findMenuById(id: number): Promise<Menu | null> {
    return this.menuRepo.findOne({ where: { id } });
  }

  async createMenu(dto: CreateMenuDto): Promise<Menu> {
    const code = dto.code.trim();
    const name = dto.name.trim();
    if (!code || !name) {
      throw new BadRequestException('菜单编码和名称不能为空');
    }
    const existed = await this.menuRepo.findOne({ where: { code } });
    if (existed) {
      throw new ConflictException('菜单编码已存在');
    }
    const parentId = await this.resolveParentId(dto.parentId);
    const entity = this.menuRepo.create({
      code,
      name,
      parentId,
      path: dto.path?.trim() || null,
      icon: dto.icon?.trim() || null,
      type: dto.type ?? 1,
      sort: dto.sort ?? 0,
      status: dto.status ?? '1',
    });
    return this.menuRepo.save(entity);
  }

  async updateMenu(dto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.menuRepo.findOne({ where: { id: dto.id } });
    if (!menu) {
      throw new NotFoundException('菜单不存在');
    }
    if (dto.code !== undefined) {
      const code = dto.code.trim();
      if (!code) {
        throw new BadRequestException('菜单编码不能为空');
      }
      const dup = await this.menuRepo.findOne({ where: { code } });
      if (dup && dup.id !== menu.id) {
        throw new ConflictException('菜单编码已存在');
      }
      menu.code = code;
    }
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('菜单名称不能为空');
      }
      menu.name = name;
    }
    if (dto.parentId !== undefined) {
      if (dto.parentId === menu.id) {
        throw new BadRequestException('上级菜单不能为自己');
      }
      menu.parentId = await this.resolveParentId(dto.parentId, menu.id);
    }
    if (dto.path !== undefined) {
      menu.path = dto.path.trim() || null;
    }
    if (dto.icon !== undefined) {
      menu.icon = dto.icon.trim() || null;
    }
    if (dto.type !== undefined) menu.type = dto.type;
    if (dto.sort !== undefined) menu.sort = dto.sort;
    if (dto.status !== undefined) menu.status = dto.status;
    return this.menuRepo.save(menu);
  }

  async deleteMenu(id: number): Promise<void> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('菜单不存在');
    }
    const childCount = await this.menuRepo.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ConflictException('存在子菜单，无法删除');
    }
    await this.roleMenuRepo.delete({ menuId: id });
    await this.menuRepo.delete(id);
  }

  private async resolveParentId(
    parentId: number | null | undefined,
    selfId?: number,
  ): Promise<number | null> {
    if (parentId === undefined || parentId === null) {
      return null;
    }
    if (selfId != null && parentId === selfId) {
      throw new BadRequestException('上级菜单不能为自己');
    }
    const parent = await this.menuRepo.findOne({ where: { id: parentId } });
    if (!parent) {
      throw new BadRequestException('上级菜单不存在');
    }
    return parentId;
  }

  private toTreeNode(m: Menu): MenuTreeNode {
    return {
      id: m.id,
      parentId: m.parentId,
      code: m.code,
      name: m.name,
      path: m.path,
      icon: m.icon,
      type: m.type,
      sort: m.sort,
      children: [],
    };
  }

  private buildTree(flat: MenuTreeNode[]): MenuTreeNode[] {
    const byId = new Map(flat.map((n) => [n.id, { ...n, children: [] as MenuTreeNode[] }]));
    const roots: MenuTreeNode[] = [];
    for (const node of byId.values()) {
      if (node.parentId == null || !byId.has(node.parentId)) {
        roots.push(node);
      } else {
        byId.get(node.parentId)!.children.push(node);
      }
    }
    const sortNodes = (list: MenuTreeNode[]) => {
      list.sort((a, b) => a.sort - b.sort || a.id - b.id);
      for (const n of list) sortNodes(n.children);
    };
    sortNodes(roots);
    return roots;
  }
}
