import request from "../reuquest"

const chatDeepSeekInterface = function(param){
    return request({
        url:"/chat/deepseek",
        method:"post",
        data:param
    })
}
export default{
    chatDeepSeekInterface,
}