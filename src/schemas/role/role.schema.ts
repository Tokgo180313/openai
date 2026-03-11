import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({
  timestamps: true,
})
export class Role extends Document {
  @Prop({ required: true,unique:true })
  roleId: string;
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  status: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
