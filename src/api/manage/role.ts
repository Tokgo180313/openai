import request from "../reuquest";

const getRoleListInterface = function(param){
    return request({
        url:"/role/getList",
        method:"post",
        data:param
    })
}
const addRoleInterface = function(param){
    return request({
        url:"/role/add",
        method:"post",
        data:param
    })
}
const deleteRoleInterface = function(param){
    return request({
        url:"/role/delete",
        method:"post",
        data:param
    })
}
export default{
    getRoleListInterface,
    addRoleInterface,
    deleteRoleInterface
}