import request from "../reuquest"
const findUsageListInterface = function (param: Record<string, unknown>){
    return request({
        url:"/usage/findUsageList",
        method:"post",
        data:param
    })
}
export default{
    findUsageListInterface
}