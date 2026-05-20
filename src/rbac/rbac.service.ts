import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { RoleMenu } from './entities/role-menu.entity';
import { Role } from 'src/role/entities/role.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { MenuTreeNode } from 'src/menu/dto/menu.dto';
import { RoleId } from './constants/role.constants';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(RoleMenu)
    private readonly roleMenuRepo: Repository<RoleMenu>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
  ) {}

  async getUserRoleIds(userId: string): Promise<number[]> {
    const rows = await this.userRoleRepo.find({ where: { userId } });
    return rows.map((r) => r.roleId);
  }

  pickPrimaryRoleId(ids: number[]): number | null {
    if (ids.length === 0) return null;
    const order = [
      RoleId.SUPER_ADMIN,
      RoleId.ADMIN,
      RoleId.TEAM_MANAGER,
      RoleId.MEMBER,
      RoleId.TEAM_MEMBER,
    ];
    for (const id of order) {
      if (ids.includes(id)) return id;
    }
    return ids[0];
  }

  async getPrimaryRoleId(userId: string): Promise<number | null> {
    const ids = await this.getUserRoleIds(userId);
    return this.pickPrimaryRoleId(ids);
  }

  async getUserPrimaryRoleIdMap(): Promise<Map<string, number>> {
    const rows = await this.userRoleRepo.find();
    const grouped = new Map<string, number[]>();
    for (const row of rows) {
      const list = grouped.get(row.userId) ?? [];
      list.push(row.roleId);
      grouped.set(row.userId, list);
    }
    const out = new Map<string, number>();
    for (const [userId, ids] of grouped) {
      const primary = this.pickPrimaryRoleId(ids);
      if (primary != null) out.set(userId, primary);
    }
    return out;
  }

  async setUserRoles(userId: string, roleIds: number[]): Promise<void> {
    await this.userRoleRepo.delete({ userId });
    if (roleIds.length === 0) return;
    const roles = await this.roleRepo.find({ where: { id: In(roleIds) } });
    const entities = roles.map((role) =>
      this.userRoleRepo.create({ userId, roleId: role.id }),
    );
    if (entities.length > 0) {
      await this.userRoleRepo.save(entities);
    }
  }

  async setUserRole(userId: string, roleId: number): Promise<void> {
    await this.setUserRoles(userId, [roleId]);
  }

  async assignRoleMenus(roleId: number, menuIds: number[]): Promise<void> {
    await this.roleMenuRepo.delete({ roleId });
    if (menuIds.length === 0) return;
    const entities = menuIds.map((menuId) =>
      this.roleMenuRepo.create({ roleId, menuId }),
    );
    await this.roleMenuRepo.save(entities);
  }

  async getRoleMenuIds(roleId: number): Promise<number[]> {
    const rows = await this.roleMenuRepo.find({ where: { roleId } });
    return rows.map((r) => r.menuId);
  }

  /** 为多个角色授予单个菜单（增量，不覆盖角色其它菜单） */
  async grantMenuToRoles(menuId: number, roleIds: number[]): Promise<void> {
    const unique = [...new Set(roleIds.filter((id) => Number.isInteger(id) && id > 0))];
    if (unique.length === 0) return;

    const roles = await this.roleRepo.find({ where: { id: In(unique) } });
    if (roles.length !== unique.length) {
      throw new BadRequestException('存在无效的角色 id');
    }

    const existing = await this.roleMenuRepo.find({
      where: { menuId, roleId: In(unique) },
      select: ['roleId'],
    });
    const hasRole = new Set(existing.map((r) => r.roleId));
    const toInsert = unique
      .filter((roleId) => !hasRole.has(roleId))
      .map((roleId) => this.roleMenuRepo.create({ roleId, menuId }));
    if (toInsert.length > 0) {
      await this.roleMenuRepo.save(toInsert);
    }
  }

  /** 覆盖设置某菜单的角色授权（先删后增） */
  async setMenuRoles(menuId: number, roleIds: number[]): Promise<void> {
    const unique = [...new Set(roleIds.filter((id) => Number.isInteger(id) && id > 0))];
    if (unique.length > 0) {
      const roles = await this.roleRepo.find({ where: { id: In(unique) } });
      if (roles.length !== unique.length) {
        throw new BadRequestException('存在无效的角色 id');
      }
    }
    await this.roleMenuRepo.delete({ menuId });
    if (unique.length === 0) return;
    await this.roleMenuRepo.save(
      unique.map((roleId) => this.roleMenuRepo.create({ roleId, menuId })),
    );
  }

  /** 查询已拥有某菜单权限的角色 id */
  async getRoleIdsByMenuId(menuId: number): Promise<number[]> {
    const rows = await this.roleMenuRepo.find({
      where: { menuId },
      select: ['roleId'],
    });
    return rows.map((r) => r.roleId);
  }

  async getUserMenuTree(userId: string): Promise<MenuTreeNode[]> {
    const roleIds = await this.getUserRoleIds(userId);
    if (roleIds.length === 0) return [];

    const roles = await this.roleRepo.find({
      where: { id: In(roleIds), status: '1' },
    });
    if (roles.length === 0) return [];

    const activeRoleIds = roles.map((r) => r.id);
    const roleMenus = await this.roleMenuRepo.find({
      where: { roleId: In(activeRoleIds) },
    });
    const allowedIds = new Set(roleMenus.map((rm) => rm.menuId));
    if (allowedIds.size === 0) return [];

    const allMenus = await this.menuRepo.find({
      where: { status: '1' },
      order: { sort: 'ASC', id: 'ASC' },
    });
    const menuById = new Map(allMenus.map((m) => [m.id, m]));

    const expanded = new Set(allowedIds);
    for (const id of [...allowedIds]) {
      let cur = menuById.get(id);
      while (cur?.parentId != null) {
        expanded.add(cur.parentId);
        cur = menuById.get(cur.parentId);
      }
    }

    const nodes = allMenus
      .filter((m) => expanded.has(m.id))
      .map((m) => this.toTreeNode(m));

    return this.buildTree(nodes);
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
