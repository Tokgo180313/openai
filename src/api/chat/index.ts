import request from "../reuquest";

const chatDeepSeekInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/chat/deepseek",
    method: "post",
    data: param,
  });
};
const chatGeminiInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/chat/gemini",
    method: "post",
    data: param,
  });
};
const chatChatgptInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/chat/chatgpt",
    method: "post",
    data: param,
  });
};
const chatTitleListInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/chat/titleList",
    method: "get",
    params: param,
  });
};
const chatListInterface = function (param: string | Record<string, unknown>) {
  return request({
    url: `chat/chatList/${param}`,
    method: "get",
  });
};
const streamDeepSeekInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/stream/deepseek",
    method: "post",
    data: param,
  });
};
const streamGeminiInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/stream/gemini",
    method: "post",
    data: param,
  });
};
const streamChatgptInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/stream/chatgpt",
    method: "post",
    data: param,
  });
};
const streamSaveResponseInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/stream/saveResponse",
    method: "post",
    data: param,
  });
};
const removeChatInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/chat/deleteChatTitle",
    method: "delete",
    params: param,
  });
};
const updateChatTitleInterface = function (param: Record<string, unknown>) {
  return request({
    url: "/chat/updateChatTitle",
    method: "post",
    data: param,
  });
};
export default {
  chatDeepSeekInterface,
  chatGeminiInterface,
  chatTitleListInterface,
  chatListInterface,
  streamDeepSeekInterface,
  streamSaveResponseInterface,
  removeChatInterface,
  updateChatTitleInterface,
  streamGeminiInterface,
  streamChatgptInterface,
  chatChatgptInterface
};
