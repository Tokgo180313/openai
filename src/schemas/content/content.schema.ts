import { Prop, Schema,SchemaFactory } from "@nestjs/mongoose";
import {  Document } from "mongoose";
export type ContentDocument = Content & Document;
@Schema({
    timestamps:true,
})
export class Content extends Document{

    @Prop({required:true})
    documentId:string;

    @Prop({required:true})
    content:string;

    @Prop({required:true})
    role:string;

    @Prop({required:true})
    useModel:string;
}

export const ContentSchema = SchemaFactory.createForClass(Content)