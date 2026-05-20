import request from "../reuquest";

export interface CopyOptimizationQueryDto {
  page: number;
  pageSize: number;
  type?: string;
  status?: string;
  content?: string;
}

export interface CreateCopyOptimizationDto {
  content: string;
  type: string;
  status?: string;
}

const findOptimizationListInterface = function (param: CopyOptimizationQueryDto) {
  return request({
    url: "/optimization/findList",
    method: "post",
    data: param,
  });
};

const addOptimizationInterface = function (param: CreateCopyOptimizationDto) {
  return request({
    url: "/optimization/add",
    method: "put",
    data: param,
  });
};

export default {
  findOptimizationListInterface,
  addOptimizationInterface,
};
