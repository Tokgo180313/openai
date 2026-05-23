import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('usages')
export class UsageRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nickName: string;

  @Column()
  account: string;

  @Column({ nullable: true })
  modelName: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ type: 'int', nullable: true })
  promptTokens: number;

  @Column({ type: 'int', nullable: true })
  completionTokens: number;

  @Column({ type: 'int', nullable: true })
  totalTokens: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 16, default: '0' })
  status: string;

  @Column({ type: 'int', nullable: true })
  thoughtsTokens: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
