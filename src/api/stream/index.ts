import request from "../reuquest";

const generateContentStreamInterface = function (param) {
  return request({
    url: "/stream/generateContentStream",
    method: "post",
    data: param,
  });
};
export default {
  generateContentStreamInterface,
};