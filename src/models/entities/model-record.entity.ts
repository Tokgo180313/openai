import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('models')
export class ModelRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  modelName: string;

  @Column()
  modelClassify: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 8, default: '1' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
