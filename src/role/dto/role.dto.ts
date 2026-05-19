
export class RoleDto{
    id?: string;
    name?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}

/** 新增角色 */
export class CreateRoleDto {
    name: string;
    status: string;
}
