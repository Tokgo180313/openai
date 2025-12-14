import request from "../reuquest"
const updateUserInfoInterface = function(param){
    return request({
        url:"/user/updateUser",
        method:"post",
        data:param
    })
}
const findAllUserInfoInterface = function(param){
    return request({
        url:"/user/findAll",
        method:"post",
        data:param
    })
}
 const addUserInfoInterface = function(param){
    return request({
        url:"/user/add",
        method:"post",
        data:param
    })
 }
 const resetUserInfoInterface = function(param){
    return request({
        url:"/user/reset",
        method:"post",
        data:param
    })
 }
 const removeUserInfoInterface = function(param){
    return request({
        url:"/user/deleteById",
        method:"delete",
        params:param,
    })
 }
export default {
    addUserInfoInterface,
    updateUserInfoInterface,
    findAllUserInfoInterface,
    removeUserInfoInterface,
    resetUserInfoInterface,
}
