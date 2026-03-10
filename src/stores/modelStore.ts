import defineStore from "pinia";
import api from "@/api/apiList"
let {getModelListInterface,findModelClassifyListInterface} = api;
export const useModelStore = defineStore("model",{
    state:()=>({
        modelList:[],
        modelClassifyList:[],
    }),
    persist:true,
    getters:{
        getModelList(){
            return this.modelList;
        },
        getModelClassifyList(){
            return this.modelClassifyList;
        },
    },
    actions:{
        setModelList(modelList){
            this.modelList = modelList;
        },
        fetchModelList(param){
            return getModelListInterface(param).then(res=>{
                if(res.code ===200){
                    this.modelList = res.data.list;
                    return res.data.list;
                }else{
                    return [];
                }
            }).catch(()=>{
                return [];
            })
        },
        fetchModelClassifyList(param){
            return findModelClassifyListInterface(param).then(res=>{
                if(res.code ===200){
                    this.modelClassifyList = res.data.list;
                    return res.data.list;
                }else{
                    return [];
                }
            }).catch(()=>{
                return [];
            })  
    }
})