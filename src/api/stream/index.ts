import request from "../reuquest";
import type { SendChatDto } from "@/types/send-chat.type";

const generateContentStreamInterface = function (param: SendChatDto) {
  return request({
    url: "/ai/stream",
    method: "post",
    data: param,
  });
};
export default {
  generateContentStreamInterface,
};