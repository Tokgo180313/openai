import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { randomUUID } from 'crypto';

@Entity('users')
export class User {
  /** 主键：UUID v4 */
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @BeforeInsert()
  assignId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ unique: true })
  account: string;

  @Column({ select: false })
  password: string;

  @Column()
  passwordType: string;

  @Column({ nullable: true })
  nickName: string;

  @Column({ nullable: true })
  avatar?: string;

  /** 上级用户 id（非超级管理员/管理员角色时的上下级；顶层可为 null） */
  @Column({ name: 'parent_id', type: 'varchar', length: 36, nullable: true })
  parentId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
