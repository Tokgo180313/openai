import request from "../reuquest";

/** 对应 Mongo `FieldMappings` 子文档：参数字段名映射 */
export interface FieldMappingsDto {
  prompt?: string;
  imageList?: string;
  model?: string;
  imageSize?: string;
  ImageRatio?: string;
  imageNum?: string;
}

export interface AiModelConfigCreateDto {
  provider: string;
  modelName: string;
  displayName: string;
  modelType: string;
  apiUrl: string;
  maxImageCount?: number;
  supportedAspectRatio?: string[];
  defaultAspectRatio?: string;
  supportedResolutions?: string[];
  defaultResolution?: string;
  supportedFormats?: string[];
  maxResolution?: string;
  fieldMappings?: FieldMappingsDto;
  defaultParams?: Record<string, unknown>;
  isEnabled?: boolean;
  sort?: number;
}

export type AiModelConfigUpdateDto = Partial<AiModelConfigCreateDto>;

export interface AiModelConfigQueryDto {
  page: number;
  pageSize: number;
  provider?: string;
  modelName?: string;
  modelType?: string;
  isEnabled?: boolean;
}

const addAiModelConfigInterface = function (param: AiModelConfigCreateDto) {
  return request({
    url: "/aiModelConfig/add",
    method: "put",
    data: param,
  });
};

const findAiModelConfigListInterface = function (param: AiModelConfigQueryDto) {
  return request({
    url: "/aiModelConfig/findAiModelConfigList",
    method: "post",
    data: param,
  });
};

const findAiModelConfigByIdInterface = function (param: { id: string }) {
  return request({
    url: "/aiModelConfig/findById",
    method: "get",
    params: param,
  });
};

const updateAiModelConfigByIdInterface = function (param: {
  id: string;
  dto: AiModelConfigUpdateDto;
}) {
  return request({
    url: "/aiModelConfig/updateById",
    method: "put",
    params: { id: param.id },
    data: param.dto,
  });
};

const deleteAiModelConfigByIdInterface = function (param: { id: string }) {
  return request({
    url: "/aiModelConfig/deleteById",
    method: "delete",
    params: param,
  });
};

export default {
  addAiModelConfigInterface,
  findAiModelConfigListInterface,
  findAiModelConfigByIdInterface,
  updateAiModelConfigByIdInterface,
  deleteAiModelConfigByIdInterface,
};
