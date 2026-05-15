import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('task_image_history')
@Unique('uk_task_image_user_task', ['userId', 'taskId'])
export class TaskImageHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ name: 'model_name' })
  modelName: string;

  @Column({ name: 'input_text', type: 'text' })
  inputText: string;

  @Column({ name: 'prompt', type: 'text', nullable: true })
  prompt: string | null;

  @Column({ name: 'source_images', type: 'json', nullable: true })
  sourceImages: string[];

  @Column({ name: 'result_images', type: 'json', nullable: true })
  resultImages: string[];

  @Column({ name: 'cover_image', nullable: true })
  coverImage: string;

  @Column({ name: 'image_count', default: 0 })
  imageCount: number;

  @Column({ name: 'aspect_ratio', nullable: true })
  aspectRatio: string;

  @Column({ name: 'image_size', nullable: true })
  imageSize: string;

  @Column({ type: 'int', default: 1 })
  status: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v == null ? 0 : parseFloat(v)),
    },
  })
  cost: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
