import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

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

export class ApiKey extends Document {
    modelName: string;
    modelClassify: string;
    apiKey: string;
    createdAt: Date;
    updatedAt: Date;
}

ApiKeySchema.methods.toJSON = function() {
    const ret = {...this._doc};
    if(ret.createdAt){
        ret.createdAt = ret.createdAt.toISOString();
    }
    if(ret.updatedAt){
        ret.updatedAt = ret.updatedAt.toISOString();
    }
    return ret;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);