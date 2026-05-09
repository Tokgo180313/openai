import { IsOptional, IsString } from 'class-validator';

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

    @IsOptional()
    @IsString()
    roleId?: string;

    @IsOptional()
    @IsString()
    passwordType?: string;

    @IsOptional()
    @IsString()
    nickName?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    /** 上级用户 id；roleId 为 0、1 时不参与上下级；传空字符串表示清空 */
    @IsOptional()
    @IsString()
    parentId?: string;
}