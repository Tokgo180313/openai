import request from "../reuquest";

const getRoleListInterface = function (param: Record<string, unknown>){
    return request({
        url:"/role/findRoleList",
        method:"post",
        data:param
    })
}
const addRoleInterface = function (param: Record<string, unknown>){
    return request({
        url:"/role/add",
        method:"put",
        data:param
    })
}
const stopRoleInterface = function (param: Record<string, unknown>){
    return request({
        url:"/role/stop",
        method:"post",
        params:param
    })
}
const startRoleInterface = function (param: Record<string, unknown>){
    return request({
        url:"/role/start",
        method:"post",
        params:param
    })
}
export default{
    getRoleListInterface,
    addRoleInterface,
    stopRoleInterface,
    startRoleInterface
}