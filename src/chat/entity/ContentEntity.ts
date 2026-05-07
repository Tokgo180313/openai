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

    @IsString()
    type?: 'input_text' | 'input_file' | 'input_url';

    @IsString()
    openaiFileId?: string;

    @IsString()
    input_url?: string;

    @IsString()
    image_base64?: string;

    @IsString()
    gridFsFileId?: string;

    @IsString()
    fileName?: string;

    @IsString()
    mimeType?: string;

    @IsString()
    fileUrl?: string;

    @IsString()
    file_url?: string;

    @IsString()
    file?:string;
}

