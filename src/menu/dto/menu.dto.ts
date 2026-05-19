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
