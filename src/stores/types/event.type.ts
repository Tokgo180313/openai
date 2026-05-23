export type EventType = 'chat-change' | 'add-chat-title' | 'update-chat-list'
export interface EventPayload{
    type:EventPayload;
    data?:any;
    timestamp:number;
}