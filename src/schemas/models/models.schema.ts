import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ModelDocument = Models & Document;

@Schema({
    timestamps: true,
}) 
export class Models extends Document{

    @Prop({required:true})
    modelName:string;

    @Prop({required:true})
    modelClassify:string;

    @Prop()
    description:string;

}

export const ModelSchema = SchemaFactory.createForClass(Models);

// 添加实例方法
ModelSchema.methods.toJSON = function() {
    const ret = {...this._doc};
    if(ret.createdAt){
        ret.createdAt = ret.createdAt.toISOString();
    }
    if(ret.updatedAt){
        ret.updatedAt = ret.updatedAt.toISOString();
    }
    return ret;
}