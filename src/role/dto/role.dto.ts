
export class RoleDto{
    id?: string;
    name?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}

/** 新增角色请求体（对应原 Mongoose Role 字段） */
export class CreateRoleDto {
    roleId: string;
    name: string;
    status: string;
}