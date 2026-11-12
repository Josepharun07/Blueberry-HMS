import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logging/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as { message?: string }).message || message;
        errors = (exceptionResponse as { errors?: unknown }).errors || null;
      } else {
        message = exceptionResponse;
      }
    }

    const path = request.path || request.url.split('?')[0];
    const clientMessage = status >= 500 ? 'Internal server error' : message;

    this.logger.error(
      `${request.method} ${path} - Status: ${status}`,
      exception instanceof Error ? exception.stack : '',
      'HttpExceptionFilter',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path,
      method: request.method,
      message: clientMessage,
      ...(status < 500 && errors ? { errors } : {}),
    });
  }
}
