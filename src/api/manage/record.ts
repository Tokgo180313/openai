import request from "../reuquest"
const findRecordListInterface = function (param: Record<string, unknown>){
    return request({
        url:"/record/findRecordList",
        method:"post",
        data:param
    })
}
export default{
    findRecordListInterface
}