import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/** 叶子类型 */
export const LEAF_PARAM_TYPES = [
  'number',
  'string',
  'boolean',
  'enum',
  'array',
] as const;

/** 容器类型：可挂子参数 */
export const CONTAINER_PARAM_TYPES = ['object', 'object[]'] as const;

export const PARAM_TYPES = [
  ...LEAF_PARAM_TYPES,
  ...CONTAINER_PARAM_TYPES,
] as const;

export type ParamType = (typeof PARAM_TYPES)[number];
export type LeafParamType = (typeof LEAF_PARAM_TYPES)[number];
export type ContainerParamType = (typeof CONTAINER_PARAM_TYPES)[number];

/** array 时元素类型（仅叶子） */
export const ARRAY_ITEM_PARAM_TYPES = [
  'number',
  'string',
  'boolean',
  'enum',
] as const;

@Entity('ai_model_param_whitelists')
@Unique('uk_model_param_path', ['modelId', 'paramPath'])
@Index('idx_param_whitelist_model_enabled', ['modelId', 'enabled'])
@Index('idx_param_whitelist_parent', ['parentId'])
export class AiModelParamWhitelist {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'model_id', type: 'bigint' })
  modelId: number;

  /** 父节点；根参数为 null */
  @Column({ name: 'parent_id', type: 'bigint', nullable: true })
  parentId: number | null;

  /**
   * 系统内全路径，如 temperature、messages[]、messages[].role、metadata.tags[]
   */
  @Column({ name: 'param_path', type: 'varchar', length: 512 })
  paramPath: string;

  /** 当前层级段名（非全路径） */
  @Column({ name: 'param_key', type: 'varchar', length: 128 })
  paramKey: string;

  /** 上游接口当前层级字段名 */
  @Column({ name: 'api_param_key', type: 'varchar', length: 128 })
  apiParamKey: string;

  /** 上游接口全路径 */
  @Column({ name: 'api_param_path', type: 'varchar', length: 512 })
  apiParamPath: string;

  @Column({ name: 'param_type', type: 'varchar', length: 32 })
  paramType: string;

  /**
   * 当 param_type=array 时表示元素类型；
   * object[] 子节点由 children 描述，此项为空
   */
  @Column({
    name: 'item_param_type',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  itemParamType: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  required: number;

  @Column({ name: 'default_value', type: 'json', nullable: true })
  defaultValue: unknown | null;

  @Column({
    name: 'min_value',
    type: 'decimal',
    precision: 20,
    scale: 6,
    nullable: true,
  })
  minValue: string | null;

  @Column({
    name: 'max_value',
    type: 'decimal',
    precision: 20,
    scale: 6,
    nullable: true,
  })
  maxValue: string | null;

  @Column({ name: 'enum_values', type: 'json', nullable: true })
  enumValues: unknown[] | null;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  enabled: number;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'varchar', length: 512, nullable: true })
  remark: string | null;
}
