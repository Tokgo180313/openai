import request from "../reuquest"

const chatDeepSeekInterface = function(param){
    return request({
        url:"/chat/deepseek",
        method:"post",
        data:param
    })
}
const chatTitleListInterface = function(param){
    return request({
        url:"/chat/titleList",
        method:"get",
        data:param
    })
}
const chatListInterface = function(param){
    return request({
        url:`chat/chatList/${param}`,
        method:"get"
    })
}
export default{
    chatDeepSeekInterface,
    chatTitleListInterface,
    chatListInterface
}