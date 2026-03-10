import request from "../reuquest"
const findRecordListInterface = function(param){
    return request({
        url:"/record/findList",
        method:"post",
        data:param
    })
}
export default{
    findRecordListInterface
}