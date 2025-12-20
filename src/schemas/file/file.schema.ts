import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
export  type FileDocument = File & Document;
@Schema({
    timestamps:true,
})
export class File extends Document {

    @Prop({required:true})
    userId:string;
    @Prop({required:true})
    url:string;
    @Prop({required:true})
    title:string;
    @Prop({required:true})
    createTime:Date;
    @Prop({required:true})
    updateTime:Date;
}

export const FileSchema = SchemaFactory.createForClass(File)