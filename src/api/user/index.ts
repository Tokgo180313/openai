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
        method:"put",
        data:param
    })
 }
 const resetUserInfoInterface = function(param){
    return request({
        url:"/user/resetById",
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
const updatePasswordInterface = function(param){
    return request({
        url:"/user/updatePassword",
        method:"post",
        data:param,
    })
 }
export default {
    addUserInfoInterface,
    updateUserInfoInterface,
    findAllUserInfoInterface,
    removeUserInfoInterface,
    resetUserInfoInterface,
    updatePasswordInterface
}
