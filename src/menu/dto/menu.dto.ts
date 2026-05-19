import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

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
