import request from "../reuquest"
const findApiKeyListInterface = function(param){
    return request({
        url:"/apiKey/findList",
        method:"post",
        data:param
    })
}
const addApiKeyInterface = function(param){
    return request({
        url:"/apiKey/add",
        method:"post",
        data:param
    })
}
const deleteApiKeyInterface = function(param){
    return request({
        url:"/apiKey/delete",
        method:"post",
        data:param
    })
}
export default{
    findApiKeyListInterface,
    addApiKeyInterface,
    deleteApiKeyInterface,
}
