import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  /** 加密存储 */
  @Column({ type: 'text' })
  apiKey: string;

  /** 小写归一化存储，查询时不区分大小写 */
  @Column({ length: 255 })
  modelClassify: string;

  @Column({ length: 2048, nullable: true })
  baseURL: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
