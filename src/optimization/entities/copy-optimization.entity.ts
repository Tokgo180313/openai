import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** 文案优化记录 */
@Entity('copy_optimizations')
export class CopyOptimization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  /** 文案类型（业务自定义，如 title、description） */
  @Column({ type: 'varchar', length: 64 })
  type: string;

  /** 1 启用 0 停用 */
  @Column({ type: 'varchar', length: 1, default: '1' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
