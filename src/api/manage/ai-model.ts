import request from "../reuquest";

const prefix = "/ai-model";

export interface AiModelCreateDto {
  provider: string;
  modelCode: string;
  apiModelName: string;
  modelType: string;
  baseUrl?: string;
  sort?: number;
}

export interface AiModelQueryDto {
  page?: number;
  pageSize?: number;
  provider?: string;
  modelCode?: string;
  modelType?: string;
  /** 1 启用 / 0 禁用 */
  enabled?: string;
}

export interface AiModelUpdateDto {
  id: string;
  provider?: string;
  modelCode?: string;
  apiModelName?: string;
  modelType?: string;
  baseUrl?: string;
  sort?: number;
  /** 1 启用 / 0 禁用 */
  enabled?: string;
}

const findAiModelListInterface = function (param: AiModelQueryDto) {
  return request({
    url: `${prefix}/findAiModelList`,
    method: "post",
    data: param,
  });
};

const addAiModelInterface = function (param: AiModelCreateDto) {
  return request({
    url: `${prefix}/add`,
    method: "put",
    data: param,
  });
};

const updateAiModelInterface = function (param: AiModelUpdateDto) {
  return request({
    url: `${prefix}/update`,
    method: "put",
    data: param,
  });
};

const findAiModelByIdInterface = function (param: { id: string }) {
  return request({
    url: `${prefix}/findById`,
    method: "get",
    params: param,
  });
};

const deleteAiModelByIdInterface = function (param: { id: string }) {
  return request({
    url: `${prefix}/deleteById`,
    method: "delete",
    params: param,
  });
};

const findAiModelProviderListInterface = function () {
  return request({
    url: `${prefix}/findProviderList`,
    method: "get",
  });
};

const enableAiModelByIdInterface = function (param: { id: string }) {
  return request({
    url: `${prefix}/enableById`,
    method: "put",
    params: param,
  });
};

const disableAiModelByIdInterface = function (param: { id: string }) {
  return request({
    url: `${prefix}/disableById`,
    method: "put",
    params: param,
  });
};

const syncOpenAIModelsInterface = function (param: { provider: string }) {
  return request({
    url: `${prefix}/syncOpenAIModels`,
    method: "get",
    params: param,
  });
};

export default {
  findAiModelListInterface,
  addAiModelInterface,
  updateAiModelInterface,
  findAiModelByIdInterface,
  deleteAiModelByIdInterface,
  findAiModelProviderListInterface,
  enableAiModelByIdInterface,
  disableAiModelByIdInterface,
  syncOpenAIModelsInterface,
};
