import request from "../reuquest"
const findUsageListInterface = function(param){
    return request({
        url:"/usage/findUsageList",
        method:"post",
        data:param
    })
}
export default{
    findUsageListInterface
}