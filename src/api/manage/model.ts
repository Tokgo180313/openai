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
        url:"/model/delete",
        method:"delete",
        data:param
    })
}
const findModelClassifyListInterface = function(param){
    return request({
        url:"/model/findClassifyList",
        method:"get",
        data:param
    })
}
export default{
    findModelListInterface,
    addModelInterface,
    deleteModelInterface,
    findModelClassifyListInterface
}
