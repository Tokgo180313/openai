import { IsNumber, IsString } from "class-validator";

export class ContentEntity{

    @IsString()
    id:string;

    @IsString()
    documentId:string;
    @IsString()
    content:string | null;

    @IsNumber()
    created:Number;

    @IsString()
    role:string | null;

    @IsString()
    useModel:string;
}

