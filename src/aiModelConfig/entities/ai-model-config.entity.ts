import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export type FieldMappingsJson = {
  prompt?: string;
  imageList?: string;
  model?: string;
  imageSize?: string;
  ImageRatio?: string;
  imageNum?: string;
  provider?: string;
  outputNum?: string;
  resolution?: string;
};

@Entity('ai_model_configs')
@Unique('uk_ai_model_provider_name', ['provider', 'modelName'])
export class AiModelConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string;

  @Column()
  modelName: string;

  @Column()
  displayName: string;

  @Column()
  modelType: string;

  @Column({ type: 'text' })
  apiUrl: string;

  @Column({ type: 'int', default: 0 })
  maxImageCount: number;

  @Column({ type: 'json', nullable: true })
  supportedAspectRatio: string[];

  @Column({ nullable: true })
  defaultAspectRatio: string;

  @Column({ type: 'json', nullable: true })
  supportedResolutions: string[];

  @Column({ nullable: true })
  defaultResolution: string;

  @Column({ type: 'json', nullable: true })
  supportedFormats: string[];

  @Column({ nullable: true })
  maxResolution: string;

  @Column({ type: 'json', nullable: true })
  fieldMappings: FieldMappingsJson;

  @Column({ type: 'json', nullable: true })
  defaultParams: Record<string, unknown>;

  @Column({ default: true })
  isEnabled: boolean;

  /** 是否与 OpenAI 接口/协议兼容 */
  @Column({ default: false })
  compatibleWithOpenAi: boolean;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
