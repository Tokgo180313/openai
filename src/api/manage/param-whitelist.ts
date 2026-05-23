import request from "../reuquest";

const prefix = "/white-list";

export interface ParamWhitelistCreateDto {
  modelId: string;
  /** 根参数不传；嵌套参数传父节点 id */
  parentId?: string | null;
  paramKey: string;
  apiParamKey: string;
  paramType: string;
  /** paramType=array 时必填 */
  itemParamType?: string;
  required?: number;
  defaultValue?: unknown;
  minValue?: string;
  maxValue?: string;
  enumValues?: unknown[];
  enabled?: number;
  sort?: number;
  remark?: string;
}

export interface ParamWhitelistQueryDto {
  page?: number;
  pageSize?: number;
  modelId?: string;
  parentId?: string;
  paramKey?: string;
  paramPath?: string;
  paramType?: string;
  /** 1 启用 / 0 禁用 */
  enabled?: string;
}

export interface ParamWhitelistUpdateDto {
  id: string;
  modelId?: string;
  parentId?: string | null;
  paramKey?: string;
  apiParamKey?: string;
  paramType?: string;
  itemParamType?: string | null;
  required?: number;
  defaultValue?: unknown;
  minValue?: string | null;
  maxValue?: string | null;
  enumValues?: unknown[] | null;
  enabled?: number;
  sort?: number;
  remark?: string | null;
}

const addParamWhitelistInterface = function (param: ParamWhitelistCreateDto) {
  return request({
    url: `${prefix}/add`,
    method: "put",
    data: param,
  });
};

const updateParamWhitelistInterface = function (param: ParamWhitelistUpdateDto) {
  return request({
    url: `${prefix}/update`,
    method: "put",
    data: param,
  });
};

const findParamWhitelistListInterface = function (param: ParamWhitelistQueryDto) {
  return request({
    url: `${prefix}/findList`,
    method: "post",
    data: param,
  });
};

const findParamWhitelistByIdInterface = function (param: { id: string }) {
  return request({
    url: `${prefix}/findById`,
    method: "get",
    params: param,
  });
};

const findParamWhitelistByModelIdInterface = function (param: { modelId: string }) {
  return request({
    url: `${prefix}/findByModelId`,
    method: "get",
    params: param,
  });
};

const deleteParamWhitelistByIdInterface = function (param: { id: string }) {
  return request({
    url: `${prefix}/deleteById`,
    method: "delete",
    params: param,
  });
};

const enableParamWhitelistByIdInterface = function (param: { id: string }) {
  return request({
    url: `${prefix}/enableById`,
    method: "put",
    params: param,
  });
};

const disableParamWhitelistByIdInterface = function (param: { id: string }) {
  return request({
    url: `${prefix}/disableById`,
    method: "put",
    params: param,
  });
};

export default {
  addParamWhitelistInterface,
  updateParamWhitelistInterface,
  findParamWhitelistListInterface,
  findParamWhitelistByIdInterface,
  findParamWhitelistByModelIdInterface,
  deleteParamWhitelistByIdInterface,
  enableParamWhitelistByIdInterface,
  disableParamWhitelistByIdInterface,
};
