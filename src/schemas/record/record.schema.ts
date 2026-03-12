
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecordDocument = Record & Document;

@Schema({
    timestamps: true,
})
export class Record extends Document {
    userId: string;
    userName: string;
    account: string;
    modelName: string;
    classify: string;
    recordType: string;
    promptTokens:number;
    completionTokens:number;
    totalTokens:number;
}
export const RecordSchema = SchemaFactory.createForClass(Record);  

RecordSchema.methods.toJSON = function() {
    const ret = {...this._doc};
    if(ret.createdAt){
        ret.createdAt = ret.createdAt.toISOString();
    }
    if(ret.updatedAt){
        ret.updatedAt = ret.updatedAt.toISOString();
    }
    return ret;
}

