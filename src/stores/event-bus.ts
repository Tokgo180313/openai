import type { EventType } from "./types/event.type";
import { defineStore } from "pinia";
import type { EventPayload, EventType } from "./types/event.type";
import { ref } from "vue";
type EventCallback = (payload:any) => void
export const useEventsBus = defineStore("eventBus",()=>{
    const listeners = ref<Map<eventType,EventCallback[]>>(new Map());
    const emit = (event:EventType,data?:any)=>{
        const callbacks = listeners.value.get(event)||[];

        const payload :EventPayload = {
            type:event,
            data,
            timestamp:Date.now(),
        }

        callbacks.forEach(callback => {
            try {
                callback(payload)
            } catch (error) {
                console.error(`Event ${event} callback error:`,error);
                
            }
        });
    };
    const on = (event:EventType,callback:EventCallback)=>{
        if(!listeners.value.has(event)){
            listeners.value.set(event,[])
        }
        
        listeners.value.get(event)?.push(callback)
        return ()=>{
            off(event,callback)
        }
    };
    const off = (event:EventType,callback:EventCallback)=>{
        const callbacks = listeners.value.get(event);
        if(callbacks){
            const index = callbacks.indexOf(callback);
            if(index>-1){
                callbacks.splice(index,1)
            }
        }
    };
    const once = (event:EventType,callback:EventCallback)=>{
        const onceCallback = (payload:ayn)=>{
            callback(payload);
            off(event,onceCallback);
        }
        on(event,onceCallback);
    };
    return {
        emit,
        on,
        off,
        once,
    }
})
