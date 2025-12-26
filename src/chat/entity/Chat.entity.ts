import { IsString } from "class-validator";

export interface CreateChatEntity {
    id:string;
    title:string;
    userId:string;
    documentId:string;
}
export class ChatEntity{
    @IsString()
    id:string;
    @IsString()
    title:string;
    @IsString()
    userId:string;
    @IsString()
    documentId:string;

    constructor(data:CreateChatEntity){
        this.id = data.id;
        this.title = data.title;
        this.userId = data.userId;
        this.documentId = data.documentId;
    }

}