import { defineStore } from "pinia";
export const useRequestStore = defineStore('request',{
    state:()=>({
        questionType:null,
    }),
    getters:{
        getQuestionType():string {
            return this.questionType;
        }
    },
    actions:{
        updateQuestionTye(value:string){
            this.questionType = value
        }
    }
})