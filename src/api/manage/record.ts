import request from "../reuquest"
const findRecordListInterface = function(param){
    return request({
        url:"/record/findRecordList",
        method:"post",
        data:param
    })
}
export default{
    findRecordListInterface
}