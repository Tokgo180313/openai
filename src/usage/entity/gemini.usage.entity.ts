export interface GeminiUsageEntity {
    promptTokenCount:number;    
    candidatesTokenCount:number;
    totalTokenCount:number;
    promptTokensDetails:Array<{modality:string,partIndex:number,cachedContentTokenCount:number}>;
    thoughtsTokenCount:number;
}