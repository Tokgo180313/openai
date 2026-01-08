import { IsNumber, IsString } from "class-validator";

export class ContentEntity{

    @IsString()
    id:string;

    @IsString()
    documentId:string;
    @IsString()
    content:string | null;

    @IsString()
    role:string | null;

    @IsString()
    useModel:string;
}

