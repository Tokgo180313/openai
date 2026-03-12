
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsageDocument = Usage & Document;

@Schema({
    timestamps: true,
})
export class Usage extends Document {
    @Prop()
    nickName: string;
    @Prop({required:true})
    account: string;
    @Prop()
    modelName?: string;
    @Prop()
    modelClassify?: string;
    @Prop()
    promptTokens?:number;
    @Prop()
    completionTokens?:number;
    @Prop()
    totalTokens?:number;
    @Prop()
    description?:string;
    @Prop()
    status:string;
}
export const UsageSchema = SchemaFactory.createForClass(Usage);  

UsageSchema.methods.toJSON = function() {
    const ret = {...this._doc};
    if(ret.createdAt){
        ret.createdAt = ret.createdAt.toISOString();
    }
    if(ret.updatedAt){
        ret.updatedAt = ret.updatedAt.toISOString();
    }
    return ret;
}

