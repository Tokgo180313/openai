import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TaskImageDocument = HydratedDocument<TaskImage>;

/** 进行中的图片生成任务（与 task_image_history 分离） */
@Schema({ collection: 'task_image', timestamps: true })
export class TaskImage {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  taskId: string;

  @Prop()
  modelName?: string;

  @Prop({ default: '' })
  inputText: string;

  @Prop()
  prompt?: string;

  @Prop({ type: [String], default: [] })
  sourceImages: string[];

  @Prop({ type: [String], default: [] })
  resultImages: string[];

  @Prop()
  coverImage?: string;

  @Prop({ default: 0 })
  imageCount: number;

  @Prop()
  aspectRatio?: string;

  @Prop()
  imageSize?: string;

  @Prop()
  provider?: string;

  /** 1 进行中；0 已删除 */
  @Prop({ default: 1 })
  status: number;

  @Prop({ default: 0 })
  cost: number;
}

export const TaskImageSchema = SchemaFactory.createForClass(TaskImage);
TaskImageSchema.index({ userId: 1, taskId: 1 }, { unique: true });
