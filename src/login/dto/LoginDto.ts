import { ApiProperty } from "@nestjs/swagger"
import { IsString, minLength } from "class-validator"

export class LoginDto{
    @IsString()
    account:string

    @IsString()
    password:string
}