import { message } from "ant-design-vue";
import axios from "axios";
const service = axios.create({
    baseURL:import.meta.env.VITE_APP_BASIC_URL,
    timeout:0,
    headers:{
        "Content-Type":"application/json"
    }
})
//请求拦截器
service.interceptors.request.use((config)=>{
    const token = sessionStorage.getItem("access_token")
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
},(error)=>{
    Promise.reject(error)
})

//响应拦截器

service.interceptors.response.use((response)=>{
    return response.data
},(error)=>{
    message.error(error.response.data.message||error)
    return Promise.reject(error)
})

export default service