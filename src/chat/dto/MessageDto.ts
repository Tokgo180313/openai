import { IsString } from "class-validator"


export class MessageDto{

    @IsString()
    id:string

    @IsString()
    role:string

    @IsString()
    content:string
}