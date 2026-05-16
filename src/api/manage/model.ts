import request from "../reuquest"
const findModelListInterface = function(param){
    return request({
        url:"/model/findModelList",
        method:"post",
        data:param
    })
}
const addModelInterface = function(param){
    return request({
        url:"/model/add",
        method:"put",
        data:param
    })
}
const deleteModelInterface = function(param){
    return request({
        url:"/model/deleteById",
        method:"delete",
        params:param
    })
}
const findModelClassifyListInterface = function(param){
    return request({
        url:"/model/findClassifyList",
        method:"get",
        data:param
    })
}
const updateApiKeyInterface = function(param){
    return request({
        url:"/model/updateApiKey",
        method:"post",
        data:param
    })
}
const findOpenaiModelListInterface = function(param){
    return request({
        url:"/model/openaiModelList",
        method:"get",
        params:param
    })
}
const enableModelInterface = function(param){
    return request({
        url:"/model/enableById",
        method:"put",
        params:param
    })
}
const disableModelInterface = function(param){
    return request({
        url:"/model/disableById",
        method:"put",
        params:param
    })
}
const updateModelInterface = function(param){
    return request({
        url:"/model/update",
        method:"put",
        data:param
    })
}
export default{
    findModelListInterface,
    addModelInterface,
    deleteModelInterface,
    findModelClassifyListInterface,
    updateApiKeyInterface,
    findOpenaiModelListInterface,
    enableModelInterface,
    disableModelInterface,
    updateModelInterface,
}
