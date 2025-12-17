import request from "../reuquest"
const loginInterface = function(param){
    return request({
        url:"/auth/login",
        method:'post',
        data:param
    })
}
const validateTokenInterface = function(){
    return request({
        url:"/auth/validate",
        method:"get"
    })
}
export default {
    loginInterface,
    validateTokenInterface,
}