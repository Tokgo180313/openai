import request from "../reuquest"
const loginInterface = function(param){
    return request({
        url:"/auth/login",
        method:'post',
        data:param
    })
}
export default {
    loginInterface
}