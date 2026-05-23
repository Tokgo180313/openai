export interface MessageType {
    prompt: string;
    model: string;
    baseURL?: string;
    provider?: string;
    role?: string;
    id?: string;
    titleId?: string;
    documentId?: string;
    userId?: string;
    type?: 'input_text' | 'input_file' | 'input_url';
}