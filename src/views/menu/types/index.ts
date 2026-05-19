export interface MenuQueryForm {
  id?: number;
  parentId?: number | null;
  code?: string;
  name?: string;
  path?: string;
  status?: string;
}

export interface MenuRow {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  path: string | null;
  icon: string | null;
  type: number;
  sort: number;
  status: string;
  updatedAt?: string;
  children?: MenuRow[];
}

export interface MenuTreeNode extends MenuRow {
  children?: MenuTreeNode[];
}

export interface CreateMenuDto {
  code: string;
  name: string;
  parentId?: number | null;
  path?: string;
  icon?: string;
  type?: number;
  sort?: number;
  status?: string;
}

export interface UpdateMenuDto {
  id: number;
  code?: string;
  name?: string;
  parentId?: number | null;
  path?: string;
  icon?: string;
  type?: number;
  sort?: number;
  status?: string;
}

export interface ParentTreeOption {
  value: number;
  title: string;
  disabled?: boolean;
  children?: ParentTreeOption[];
}
