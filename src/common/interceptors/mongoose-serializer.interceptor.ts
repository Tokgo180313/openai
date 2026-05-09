
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MongooseSerializerInterceptor implements NestInterceptor {
    /** 序列化为北京时间 Asia/Shanghai（UTC+8），格式 YYYY-MM-DD HH:mm:ss */
    private static formatDateTimeBeijing(d: Date): string {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(d);
        const pick = (t: Intl.DateTimeFormatPart['type']) =>
            parts.find((p) => p.type === t)?.value ?? '';
        return `${pick('year')}-${pick('month')}-${pick('day')} ${pick('hour')}:${pick('minute')}:${pick('second')}`;
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                return this.transform(data);
            }),
        );
    }
    private transform(data: any): any {
        if (data === null || data === undefined) {
            return data;
        }
        // Date 为 object，展开 `{ ...date }` 会变成 {}，且递归会破坏序列化
        if (data instanceof Date) {
            if (Number.isNaN(data.getTime())) {
                return null;
            }
            return MongooseSerializerInterceptor.formatDateTimeBeijing(data);
        }

        if(typeof data !== 'object'){
            return data;
        }

        if(Array.isArray(data)){
            return data.map(item => this.transform(item));
        }
        if(data && typeof data === 'object'){
            const obj = data.toObject
                ? data.toObject()
                : { ...(data as Record<string, unknown>) };
            if(obj._id){
                obj.id = obj._id.toString();
                delete obj._id;
            }
            if ('password' in obj && obj.password !== undefined) {
                delete obj.password;
            }
            if(obj.apiKey){
                obj.isApiKeySet = true;
                delete obj.apiKey;
            }
            if(obj.__v !== undefined){
                delete obj.__v;
            }
            for(const key in obj){
                if(obj[key] && typeof obj[key] === 'object'){
                    obj[key] = this.transform(obj[key]);
                }
            }
            return obj;
        }
        return data;
    }
}