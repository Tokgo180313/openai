import { defineStore } from "pinia";
export const useRequestStore = defineStore('request',{
    state: () => ({
        questionType: null as string | null,
    }),
    persist: true,
    getters: {
        getQuestionType(): string | null {
            return this.questionType;
        }
    },
    actions:{
        updateQuestionTye(value:string){
            this.questionType = value
        }
    }
})