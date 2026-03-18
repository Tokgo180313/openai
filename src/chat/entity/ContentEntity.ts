import { IsNumber, IsString } from "class-validator";

export class ContentEntity{

    @IsString()
    userId?:string;

    @IsString()
    documentId:string;
    @IsString()
    content:string;

    @IsString()
    role:string;

    @IsString()
    useModel:string;
}

