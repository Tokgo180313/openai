import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class MenuDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  status?: string;

  /** 按角色筛选菜单；角色 1（超管）返回全部菜单 */
  @IsOptional()
  @IsInt()
  roleId?: number;
}

/** 新增菜单 */
export class CreateMenuDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  /** 0 目录 1 菜单页 */
  @IsOptional()
  @IsIn([0, 1])
  type?: number;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsIn(['0', '1'])
  status?: string;

  /** 可访问该菜单的角色 id 列表（roles.id） */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  roleIds?: number[];
}

/** 编辑菜单 */
export class UpdateMenuDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsIn([0, 1])
  type?: number;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsIn(['0', '1'])
  status?: string;

  /** 可访问该菜单的角色 id 列表；传入则覆盖原授权 */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  roleIds?: number[];
}

export class AssignRoleMenusDto {
  @IsInt()
  roleId: number;

  @IsArray()
  @IsInt({ each: true })
  menuIds: number[];
}

export interface MenuTreeNode {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  path: string | null;
  icon: string | null;
  type: number;
  sort: number;
  children: MenuTreeNode[];
}

/** 菜单列表项（含角色授权 roles.id） */
export type MenuWithRoleIds = {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  path: string | null;
  icon: string | null;
  type: number;
  sort: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  roleIds: number[];
};
