import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('records')
export class OperationRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nickName: string;

  @Column()
  account: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** 仅维护创建时间（无 updatedAt） */
  @CreateDateColumn()
  createdAt: Date;
}
