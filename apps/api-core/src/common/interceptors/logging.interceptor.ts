import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../logging/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = (request.path || String(request.url || '').split('?')[0]) as string;
    const startTime = Date.now();

    this.logger.log(`→ ${method} ${path}`, 'HTTP');

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          this.logger.performance(path, duration, statusCode);
          this.logger.log(
            `✓ ${method} ${path} ${statusCode} (${duration}ms)`,
            'HTTP'
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `✗ ${method} ${path} ${error.status || 500} (${duration}ms)`,
            error.stack,
            'HTTP'
          );
        },
      })
    );
  }
}
