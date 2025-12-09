import request from "../reuquest"

const chatDeepSeekInterface = function(){
    return request({
        url:"/chat/deepseek",
        method:"post"
    })
}
export default{
    chatDeepSeekInterface,
}