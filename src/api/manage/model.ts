import request from "../reuquest"
const findModelListInterface = function(param){
    return request({
        url:"/model/findList",
        method:"post",
        data:param
    })
}
const addModelInterface = function(param){
    return request({
        url:"/model/add",
        method:"post",
        data:param
    })
}
const updateModelInterface = function(param){
    return request({
        url:"/model/update",
        method:"post",
        data:param
    })
}
const deleteModelInterface = function(param){
    return request({
        url:"/model/delete",
        method:"post",
        data:param
    })
}
const findModelClassifyListInterface = function(param){
    return request({
        url:"/model/findClassifyList",
        method:"post",
        data:param
    })
}
export default{
    findModelListInterface,
    addModelInterface,
    updateModelInterface,
    deleteModelInterface,
    findModelClassifyListInterface
}
