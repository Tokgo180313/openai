import { IsString } from "class-validator";

export interface CreateChatEntity {
    title:string;
    userId:string;
    documentId:string;
}
export class ChatEntity{
    @IsString()
    title:string;
    @IsString()
    userId:string;
    @IsString()
    documentId:string;

    constructor(data:CreateChatEntity){
        this.title = data.title;
        this.userId = data.userId;
        this.documentId = data.documentId;
    }

}