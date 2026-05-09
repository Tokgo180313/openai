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

    /** 上级用户 id，仅普通用户 roleId=2 有效；传空字符串表示清空 */
    @IsOptional()
    @IsString()
    parentId?: string;
}