import request from "../reuquest";

const chatDeepSeekInterface = function (param) {
  return request({
    url: "/chat/deepseek",
    method: "post",
    data: param,
  });
};
const chatGeminiInterface = function (param) {
  return request({
    url: "/chat/gemini",
    method: "post",
    data: param,
  });
};
const chatTitleListInterface = function (param) {
  return request({
    url: "/chat/titleList",
    method: "get",
    data: param,
  });
};
const chatListInterface = function (param) {
  return request({
    url: `chat/chatList/${param}`,
    method: "get",
  });
};
const streamDeepSeekInterface = function (param) {
  return request({
    url: "/stream/deepseek",
    method: "post",
    data: param,
  });
};
const streamSaveResponseInterface = function(param){
    return request({
        url:"/stream/saveResponse",
        method:"post",
        data:param,
    })
}
const removeChatInterface = function(param){
    return request({
        url:"/chat/deleteChatTitle",
        method:"delete",
        params:param,
    });
}
export default {
  chatDeepSeekInterface,
  chatGeminiInterface,
  chatTitleListInterface,
  chatListInterface,
  streamDeepSeekInterface,
  streamSaveResponseInterface,
  removeChatInterface
};
