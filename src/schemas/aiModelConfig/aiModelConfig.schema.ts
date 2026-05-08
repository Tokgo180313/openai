import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** 上游 API 参数字段名映射（各厂商字段名不同） */
@Schema({ _id: false })
export class FieldMappings {
  @Prop()
  prompt?: string;

  @Prop()
  imageList?: string;

  @Prop()
  model?: string;

  @Prop()
  imageSize?: string;

  @Prop()
  ImageRatio?: string;

  @Prop()
  imageNum?: string;
}

export const FieldMappingsSchema = SchemaFactory.createForClass(FieldMappings);

export type AiModelConfigDocument = AiModelConfig & Document;

@Schema({
  timestamps: true,
})
export class AiModelConfig extends Document {
  @Prop({ required: true })
  provider: string;

  @Prop({ required: true })
  modelName: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  modelType: string;

  @Prop({ required: true })
  apiUrl: string;

  @Prop({ default: 0 })
  maxImageCount: number;

  @Prop({ type: [String], default: [] })
  supportedAspectRatio: string[];

  @Prop()
  defaultAspectRatio?: string;

  @Prop({ type: [String], default: [] })
  supportedResolutions: string[];

  @Prop()
  defaultResolution?: string;

  @Prop({ type: [String], default: [] })
  supportedFormats: string[];

  @Prop()
  maxResolution?: string;

  @Prop({ type: FieldMappingsSchema, default: {} })
  fieldMappings: FieldMappings;

  @Prop({ type: Object, default: {} })
  defaultParams: Record<string, unknown>;

  @Prop({ default: true })
  isEnabled: boolean;

  @Prop({ default: 0 })
  sort: number;
}

export const AiModelConfigSchema = SchemaFactory.createForClass(AiModelConfig);

AiModelConfigSchema.index({ provider: 1, modelName: 1 }, { unique: true });

AiModelConfigSchema.methods.toJSON = function () {
  const ret = { ...this._doc } as Record<string, unknown>;
  if (ret.createdAt && (ret.createdAt as Date).toISOString) {
    ret.createdAt = (ret.createdAt as Date).toISOString();
  }
  if (ret.updatedAt && (ret.updatedAt as Date).toISOString) {
    ret.updatedAt = (ret.updatedAt as Date).toISOString();
  }
  return ret;
};
