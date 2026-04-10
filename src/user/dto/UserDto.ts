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
}