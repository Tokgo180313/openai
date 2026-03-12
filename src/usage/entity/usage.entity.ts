export interface UsageEntity{
    nickName: string;
    account: string;
    modelName?: string;
    modelClassify?: string;
    promptTokens?:number;
    completionTokens?:number;
    totalTokens?:number;
    description?:string;
    status: string;
}