import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('schedule_tasks')
export class ScheduleTaskRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  conExpression: string;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ length: 32, default: 'idle' })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  lastRunAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  nextRunAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
