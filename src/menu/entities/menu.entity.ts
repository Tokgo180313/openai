import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** 菜单（目录 + 页面），仅控制到菜单层级 */
@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId: number | null;

  /** 唯一编码，如 system.user */
  @Column({ type: 'varchar', unique: true, length: 64 })
  code: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  path: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  icon: string | null;

  /** 0 目录 1 菜单页 */
  @Column({ type: 'tinyint', default: 1 })
  type: number;

  @Column({ type: 'int', default: 0 })
  sort: number;

  /** 1 启用 0 停用 */
  @Column({ type: 'varchar', length: 1, default: '1' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
