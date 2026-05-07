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

    @Prop({
        required: false,
        enum: ['input_text', 'input_file', 'input_url'],
        default: 'input_text',
    })
    type?: 'input_text' | 'input_file' | 'input_url';

    @Prop({ required: false })
    openaiFileId?: string;

    @Prop({ required: false })
    input_url?: string;

    @Prop({ required: false })
    image_base64?: string;

    @Prop({ required: false })
    gridFsFileId?: string;

    @Prop({ required: false })
    fileName?: string;

    @Prop({ required: false })
    mimeType?: string;

    @Prop({ required: false })
    file_url?: string;

    @Prop({ required: false })
    fileUrl?: string;
}

export const ContentSchema = SchemaFactory.createForClass(Content)