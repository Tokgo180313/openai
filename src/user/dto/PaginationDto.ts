import { Type } from "class-transformer"
import { IsNumber, IsString } from "class-validator"

export class PaginationDto{
    
    @IsString()
    name?:string

    @IsNumber()
    @Type(()=>Number)
    current:number=1

    @IsNumber()
    @Type(()=>Number)
    pageSize:number=10

    get skip():number{
        return (this.current-1)*this.pageSize
    }

    get limit():number{
        return this.pageSize
    }

}