import { Prop ,Schema,SchemaFactory} from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ChatTitleDocument = ChatTitle & Document;
@Schema({
    timestamps:true
})
export class ChatTitle extends Document{
    @Prop({required:true,unique:true})
    declare id:string

    @Prop({required:true})
    title:string

    @Prop({required:true})
    userId:string

    @Prop({required:true})
    documentId:string
}

export const ChatTitleSchema = SchemaFactory.createForClass(ChatTitle)