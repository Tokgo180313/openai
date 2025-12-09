import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

@Catch()
export class HttpExecptionFilter implements ExceptionFilter{
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = "Internal server error"

        if(exception instanceof HttpException){
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if(typeof exceptionResponse =="object"){
                message =(exceptionResponse as any).message || exception.message;
            }else{
                message = exceptionResponse as string
            }
        }
        response.status(status).json({
            code :status,
            message,
            timeStamp:new Date().toISOString(),
            path:request.url,
        })
    }
}