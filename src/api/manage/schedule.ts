import request from "../reuquest";

export interface ScheduleDto {
  name: string;
  conExpression: string;
  isEnabled?: boolean;
  status?: string;
  lastRunAt?: string | Date;
  nextRunAt?: string | Date;
  lastError?: string;
}

export interface ScheduleQueryDto {
  page: number;
  pageSize: number;
  name?: string;
  isEnabled?: boolean;
  status?: string;
}

export interface ScheduleUpdateDto extends Partial<ScheduleDto> {}

const addScheduleInterface = function (param: ScheduleDto) {
  return request({
    url: "/schedule/add",
    method: "put",
    data: param,
  });
};

const findScheduleListInterface = function (param: ScheduleQueryDto) {
  return request({
    url: "/schedule/findScheduleList",
    method: "post",
    data: param,
  });
};

const findScheduleByIdInterface = function (param: { id: string }) {
  return request({
    url: "/schedule/findById",
    method: "get",
    params: param,
  });
};

const updateScheduleByIdInterface = function (param: {
  id: string;
  dto: ScheduleUpdateDto;
}) {
  return request({
    url: "/schedule/updateById",
    method: "put",
    params: { id: param.id },
    data: param.dto,
  });
};

const deleteScheduleByIdInterface = function (param: { id: string }) {
  return request({
    url: "/schedule/deleteById",
    method: "delete",
    params: param,
  });
};

export default {
  addScheduleInterface,
  findScheduleListInterface,
  findScheduleByIdInterface,
  updateScheduleByIdInterface,
  deleteScheduleByIdInterface,
};
