import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** 与 ResponseInterceptor 成功体对齐：code / message / data / timestamp / path */
export interface GlobalErrorResponseBody {
  code: number;
  message: string;
  data: null;
  timestamp: number;
  path: string;
  stack?: string;
  error?: string;
  /** 仅开发环境：HttpException 原始响应或校验详情 */
  details?: unknown;
  raw?: unknown;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function normalizeMessage(message: unknown): string {
  if (Array.isArray(message)) {
    return message.map(String).join('; ');
  }
  if (typeof message === 'string') {
    return message;
  }
  if (message !== undefined && message !== null) {
    return String(message);
  }
  return '请求处理失败';
}

function extractHttpException(exception: HttpException): {
  status: number;
  message: string;
  rawResponse: string | Record<string, unknown>;
} {
  const status = exception.getStatus();
  const res = exception.getResponse();

  if (typeof res === 'string') {
    return { status, message: res, rawResponse: res };
  }

  if (typeof res === 'object' && res !== null) {
    const body = res as Record<string, unknown>;
    let message: unknown = body.message;
    if (message === undefined && typeof body.error === 'string') {
      message = body.error;
    }
    return {
      status,
      message: normalizeMessage(message ?? exception.message),
      rawResponse: body,
    };
  }

  return {
    status,
    message: exception.message,
    rawResponse: { message: exception.message },
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const prod = isProduction();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string;
    const body: Record<string, unknown> = {
      code: status,
      data: null,
      timestamp: Date.now(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      const { status: st, message: msg, rawResponse } =
        extractHttpException(exception);
      status = st;
      message = msg;

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `${request.method} ${request.url} [${status}] ${message}`,
          exception.stack,
        );
      } else {
        this.logger.warn(
          `${request.method} ${request.url} [${status}] ${message}`,
        );
      }

      body.code = status;
      body.message = message;

      if (!prod && typeof rawResponse === 'object') {
        body.details = rawResponse;
      }
    } else if (exception instanceof Error) {
      message = prod ? '服务器内部错误' : exception.message;
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body.code = status;
      body.message = message;

      this.logger.error(
        `${request.method} ${request.url} — ${exception.message}`,
        exception.stack,
      );

      if (!prod) {
        body.error = exception.name;
        body.stack = exception.stack;
      }
    } else {
      message = prod ? '服务器内部错误' : String(exception);
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body.code = status;
      body.message = message;

      this.logger.error(
        `${request.method} ${request.url} — non-Error: ${message}`,
      );

      if (!prod) {
        body.raw = exception;
      }
    }

    response.status(status).json(body as unknown as GlobalErrorResponseBody);
  }
}
