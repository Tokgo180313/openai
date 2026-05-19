import { IsInt, IsOptional, IsString } from 'class-validator';

export class UserDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsString()
    account?: string;

    @IsOptional()
    @IsString()
    password?: string;

    /** 角色主键 roles.id */
    @IsOptional()
    @IsInt()
    roleId?: number;

    @IsOptional()
    @IsString()
    passwordType?: string;

    @IsOptional()
    @IsString()
    nickName?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    /** 上级用户 id；角色 id 为 1、2（超管/管理员）时不参与上下级；传空字符串表示清空 */
    @IsOptional()
    @IsString()
    parentId?: string;
}