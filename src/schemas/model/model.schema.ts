import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ModelDocument = Model & Document;

@Schema({
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            if (ret.createdAt) {
                ret.createdAt = ret.createdAt.toISOString();
            }
            if (ret.updatedAt) {
                ret.updatedAt = ret.updatedAt.toISOString();
            }
            return ret;
        },
    },
}) 
export class Model extends Document{

    @Prop({required:true})
    modelName:string;

    @Prop({required:true})
    modelClassify:string;

    @Prop()
    description:string;

}

export const ModelSchema = SchemaFactory.createForClass(Model);

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