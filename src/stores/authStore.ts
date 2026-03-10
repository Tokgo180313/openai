import { defineStore } from "pinia";
import api from "@/api/apiList"
let {validateTokenInterface} = api;
export const useAuthStore =  defineStore("auth",{
    state:()=>({
        token:null,
        nickName:null,
        roleId:null,
        account:null,
    }),
    persist:true,
    getters:{
        getToken(){
            return this.token;
        },
        getNickName(){
            return this.nickName;
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
            sessionStorage.setItem("access_token", token);
            this.token = token
        },
        setNickName(nickName){
            sessionStorage.setItem("nick_name", nickName);
            this.nickName = nickName;
        },
        setRoleId(roleId){
            sessionStorage.setItem("role_id", roleId);
            this.roleId = roleId;
        },
        setAccount(account){
            sessionStorage.setItem("account", account);
            this.account = account;
        },
        clearToken(){
            this.token = null;
        }
    }
})