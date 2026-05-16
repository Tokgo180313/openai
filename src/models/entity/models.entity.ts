export class ModelsEntity {
  modelName: string;
  modelClassify: string;
  description: string;
  status: string;
  /** 模型类型（可选，新建时可带） */
  modelType?: string;
}