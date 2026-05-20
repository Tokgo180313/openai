import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import {
  CreateMenuDto,
  MenuDto,
  MenuTreeNode,
  MenuWithRoleIds,
  UpdateMenuDto,
} from './dto/menu.dto';
import { RbacService } from 'src/rbac/rbac.service';
import { RoleMenu } from 'src/rbac/entities/role-menu.entity';
import { RoleId } from 'src/rbac/constants/role.constants';

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

  async findMenuList(
    menuDto?: MenuDto,
    userId?: string,
  ): Promise<MenuWithRoleIds[]> {
    const roleId = await this.resolveListRoleId(menuDto, userId);
    const menus =
      roleId === RoleId.SUPER_ADMIN
        ? await this.findAllMenus(this.omitRoleId(menuDto))
        : roleId != null
          ? await this.findMenusByRoleId(roleId, menuDto)
          : await this.findAllMenus(menuDto);
    return this.attachRoleIds(menus);
  }

  private omitRoleId(menuDto?: MenuDto): MenuDto | undefined {
    if (!menuDto) return menuDto;
    const { roleId: _roleId, ...rest } = menuDto;
    void _roleId;
    return rest;
  }

  private async resolveListRoleId(
    menuDto?: MenuDto,
    userId?: string,
  ): Promise<number | null> {
    if (menuDto?.roleId != null) {
      return menuDto.roleId;
    }
    if (userId) {
      return this.rbacService.getPrimaryRoleId(userId);
    }
    return null;
  }

  private async findMenusByRoleId(
    roleId: number,
    menuDto?: MenuDto,
  ): Promise<Menu[]> {
    const roleMenus = await this.roleMenuRepo.find({
      where: { roleId },
      select: ['menuId'],
    });
    const menuIds = [...new Set(roleMenus.map((r) => r.menuId))];
    if (menuIds.length === 0) {
      return [];
    }
    const qb = this.menuRepo
      .createQueryBuilder('m')
      .where('m.id IN (:...menuIds)', { menuIds })
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

  private async attachRoleIds(menus: Menu[]): Promise<MenuWithRoleIds[]> {
    if (menus.length === 0) {
      return [];
    }
    const menuIds = menus.map((m) => m.id);
    const roleMenus = await this.roleMenuRepo.find({
      where: { menuId: In(menuIds) },
      select: ['menuId', 'roleId'],
    });
    const roleIdsByMenu = new Map<number, number[]>();
    for (const row of roleMenus) {
      const list = roleIdsByMenu.get(row.menuId) ?? [];
      list.push(row.roleId);
      roleIdsByMenu.set(row.menuId, list);
    }
    return menus.map((m) => ({
      ...m,
      roleIds: roleIdsByMenu.get(m.id) ?? [],
    }));
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
    const saved = await this.menuRepo.save(entity);
    const roleIds = await this.resolveRoleIdsForNewMenu(dto, parentId);
    await this.rbacService.grantMenuToRoles(saved.id, roleIds);
    return saved;
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
    const saved = await this.menuRepo.save(menu);
    if (dto.roleIds !== undefined) {
      await this.rbacService.setMenuRoles(saved.id, dto.roleIds);
    }
    return saved;
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

  /** 新建菜单默认授权：显式 roleIds > 继承父菜单角色 > 仅超管 */
  private async resolveRoleIdsForNewMenu(
    dto: CreateMenuDto,
    parentId: number | null,
  ): Promise<number[]> {
    if (dto.roleIds != null && dto.roleIds.length > 0) {
      return [...new Set(dto.roleIds)];
    }
    const roleIds = new Set<number>([RoleId.SUPER_ADMIN]);
    if (parentId != null) {
      const inherited = await this.rbacService.getRoleIdsByMenuId(parentId);
      for (const id of inherited) {
        roleIds.add(id);
      }
    }
    return [...roleIds];
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
