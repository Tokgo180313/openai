
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MongooseSerializerInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                return this.transform(data);
            }),
        );
    }
    private transform(data: any): any {
        if(!data || typeof data !== 'object'){
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