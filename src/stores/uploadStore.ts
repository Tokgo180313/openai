import { defineStore } from "pinia";

export const uploadStore = defineStore("store",{
    getters:{
        getImageUrl(){
            return import.meta.env.VITE_APP_BASIC_URL+"/file/uploadFile"
        },
        getFileUrl(){
            return import.meta.env.VITE_APP_BASIC_URL,+"/file/uploadFile"
        }
    }
})