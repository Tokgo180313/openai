
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecordDocument = Record & Document;

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
export class Record extends Document {
    userId: string;
    userName: string;
    account: string;
    modelName: string;
    classify: string;
    recordType: string;
}

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

export const RecordSchema = SchemaFactory.createForClass(Record);  