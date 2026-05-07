import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScheduleTaskDocument = ScheduleTask & Document;

@Schema({
  timestamps: true,
})
export class ScheduleTask extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  conExpression: string;

  @Prop({ default: true })
  isEnabled: boolean;

  @Prop({ default: 'idle' })
  status: string;

  @Prop()
  lastRunAt?: Date;

  @Prop()
  nextRunAt?: Date;

  @Prop()
  lastError?: string;
}

export const ScheduleTaskSchema = SchemaFactory.createForClass(ScheduleTask);

ScheduleTaskSchema.methods.toJSON = function () {
  const ret = { ...this._doc } as any;
  if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
  if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
  if (ret.lastRunAt instanceof Date) ret.lastRunAt = ret.lastRunAt.toISOString();
  if (ret.nextRunAt instanceof Date) ret.nextRunAt = ret.nextRunAt.toISOString();
  return ret;
};
