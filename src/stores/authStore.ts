import { defineStore } from "pinia";
import api from "@/api/apiList"
let {validateTokenInterface} = api;
export const useAuthStore =  defineStore("auth",{
    state:()=>({
        token:null,
    }),
    getters:{
        getToken(){
            return this.token;
        }
    },
    actions:{
        validateToken(){
            return validateTokenInterface().then(res=>{
                if(res.code ===200){
                    return true;
                }else{
                    return false
                }
            }).catch(()=>{
                return false
            })
        },
        setToken(token){
            this.token = token
        }
    }
})