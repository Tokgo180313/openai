import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { MenuDto, MenuTreeNode } from './dto/menu.dto';
import { RbacService } from 'src/rbac/rbac.service';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
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
    const flat: MenuTreeNode[] = menus.map((m) => ({
      id: m.id,
      parentId: m.parentId,
      code: m.code,
      name: m.name,
      path: m.path,
      icon: m.icon,
      type: m.type,
      sort: m.sort,
      children: [],
    }));
    return this.buildTree(flat);
  }

  async findMyMenuTree(userId: string): Promise<MenuTreeNode[]> {
    return this.rbacService.getUserMenuTree(userId);
  }

  async findMenuById(id: number): Promise<Menu | null> {
    return this.menuRepo.findOne({ where: { id } });
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
