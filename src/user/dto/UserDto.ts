import { isString, IsString, minLength } from "class-validator"

export class UserDto{
    @IsString()
    id:string

    @IsString()
    account:string

    @IsString()
    password:string

}