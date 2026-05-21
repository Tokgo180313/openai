import request from "../reuquest";

export interface ProviderDto {
  provider: string;
  baseURL: string;
  apiKey: string;
}

export interface ProviderQueryDto extends Partial<ProviderDto> {}

export interface ProviderUpdateDto extends Partial<ProviderDto> {}

const addProviderInterface = function (param: ProviderDto) {
  return request({
    url: "/provider/add",
    method: "put",
    data: param,
  });
};

const findProviderListInterface = function (param: ProviderQueryDto) {
  return request({
    url: "/provider/findProviderList",
    method: "post",
    data: param,
  });
};

const findByIdInterface = function (param: { id: string }) {
  return request({
    url: "/provider/findById",
    method: "get",
    params: param,
  });
};

const deleteByIdInterface = function (param: { id: string }) {
  return request({
    url: "/provider/deleteById",
    method: "delete",
    params: param,
  });
};

const updateByIdInterface = function (param: {
  id: string;
  dto: ProviderUpdateDto;
}) {
  return request({
    url: "/provider/updateById",
    method: "put",
    params: { id: param.id },
    data: param.dto,
  });
};

export default {
  addProviderInterface,
  findProviderListInterface,
  findByIdInterface,
  deleteByIdInterface,
  updateByIdInterface,
};
