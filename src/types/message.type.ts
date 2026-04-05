export interface MessageType {
    prompt: string;
    model: string;
    baseURL?: string;
    modelClassify?: string;
    role?: string;
    id?: string;
    titleId?: string;
    documentId?: string;
    userId?: string;
}