import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ai_models')
export class AiModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  /** 供应商：openai / deepseek / linkfox 等，小写归一化存储 */
  @Column({ length: 64 })
  provider: string;

  /** 系统内部使用的模型编码 */
  @Column({ name: 'model_code', length: 255 })
  modelCode: string;

  /** 真实传给上游接口的模型名 */
  @Column({ name: 'api_model_name', length: 255 })
  apiModelName: string;

  /** 模型类型：text / image / vision */
  @Column({ name: 'model_type', length: 32 })
  modelType: string;

  /** 可选；建议优先从 provider 配置读取 */
  @Column({ name: 'base_url', type: 'varchar', length: 2048, nullable: true })
  baseUrl: string | null;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  enabled: number;

  @Column({ type: 'int', default: 100 })
  sort: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
