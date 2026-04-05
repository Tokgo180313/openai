import request from "../reuquest";

export interface KeyDto {
  modelClassify: string;
  baseURL: string;
  apiKey: string;
}

export interface KeyQueryDto extends Partial<KeyDto> {}

export interface KeyUpdateDto extends Partial<KeyDto> {}

const addKeyInterface = function (param: KeyDto) {
  return request({
    url: "/key/add",
    method: "put",
    data: param,
  });
};

const findKeyListInterface = function (param: KeyQueryDto) {
  return request({
    url: "/key/findKeyList",
    method: "post",
    data: param,
  });
};

const findByIdInterface = function (param: { id: string }) {
  return request({
    url: "/key/findById",
    method: "get",
    params: param,
  });
};

const deleteByIdInterface = function (param: { id: string }) {
  return request({
    url: "/key/deleteById",
    method: "delete",
    params: param,
  });
};

const updateByIdInterface = function (param: { id: string; dto: KeyUpdateDto }) {
  return request({
    url: "/key/updateById",
    method: "put",
    params: { id: param.id },
    data: param.dto,
  });
};

export default {
  addKeyInterface,
  findKeyListInterface,
  findByIdInterface,
  deleteByIdInterface,
  updateByIdInterface,
};

