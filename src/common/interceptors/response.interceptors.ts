import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { IResponse } from "../interfaces/response.interface";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";
import { map, timestamp } from "rxjs/operators";
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T,IResponse<T>>{
    constructor(private reflector:Reflector){}
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<IResponse<T>> | Promise<Observable<IResponse<T>>> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const successMessage = this.reflector.get<string>("successMessage",context.getHandler())||'成功'
        return next.handle().pipe(
            map((data)=>({
                code:response.statusCode,
                message:successMessage||"success",
                data:data,
                timestamp:Date.now(),
                path:request.url,
               
            })),
        );
    }
}