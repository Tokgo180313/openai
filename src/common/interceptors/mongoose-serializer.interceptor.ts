
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
            const obj = data.toObject ? data.toObject() : data;
            if(obj._id){
                if(obj._id.buffer&& Buffer.isBuffer(obj._id.buffer)){
                    obj.id = obj._id.buffer.toString('hex');
                }else if(Buffer.isBuffer(obj._id)){
                    obj.id = obj._id.toString('hex');
                }else if(typeof obj._id.toHexString === 'function'){
                    obj.id = obj._id.toHexString();
                }else{
                    obj.id = String(obj._id);
                }
                delete obj._id;
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