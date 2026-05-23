export interface UsageEntity{
    nickName?: string;
    account?: string;
    modelName?: string;
    provider?: string;
    promptTokens?:number;
    completionTokens?:number;
    totalTokens?:number;
    description?:string;
    thoughtsTokens?:number;
    status?: string;
}