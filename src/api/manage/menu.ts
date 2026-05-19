import request from "../reuquest";

const findMenuListInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/menu/findMenuList",
    method: "post",
    data: param,
  });
};

const addMenuInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/menu/add",
    method: "put",
    data: param,
  });
};

const updateMenuInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/menu/update",
    method: "put",
    data: param,
  });
};

const deleteMenuByIdInterface = function (param: { id: number }) {
  return request({
    url: "/menu/deleteById",
    method: "delete",
    params: param,
  });
};

export default {
  findMenuListInterface,
  addMenuInterface,
  updateMenuInterface,
  deleteMenuByIdInterface,
};
