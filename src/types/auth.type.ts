export interface LoginMenuItem {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  path: string;
  icon: string | null;
  type: number;
  sort: number;
  children: LoginMenuItem[];
}

export interface LoginUser {
  id: string;
  account: string;
  passwordType?: string;
  nickName: string;
  avatar: string | null;
  parentId: string | null;
  createdAt?: string;
  updatedAt?: string;
  roleId: number | string;
  roleIds?: (number | string)[];
}

export interface LoginResponseData {
  access_token: string;
  user: LoginUser;
  menus?: LoginMenuItem[];
}
