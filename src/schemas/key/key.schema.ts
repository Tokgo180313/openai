import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Expose } from 'class-transformer';
import { Document } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

@Schema({
  timestamps: true,
})
export class ApiKey extends Document {
  // 注意：apiKey 会在响应中被统一隐藏（只保留是否已设置的标识）
  @Exclude()
  @Prop({ required: true })
  apiKey: string;

  @Prop({ required: true })
  modelClassify: string;

  @Prop()
  baseURL: string;

  @Expose()
  get isApiKeySet(): boolean {
    return !!this.apiKey;
  }
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

ApiKeySchema.methods.toJSON = function () {
  const ret = { ...this._doc } as any;
  if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
  if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
  return ret;
};

