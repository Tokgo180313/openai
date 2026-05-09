import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
