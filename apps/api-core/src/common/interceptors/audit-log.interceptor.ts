import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const userId = request.user?.id || null;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async (data) => {
        try {
          const actionMap = {
            POST: 'CREATE',
            PUT: 'UPDATE',
            PATCH: 'UPDATE',
            DELETE: 'DELETE',
          };

          const auditLog = this.auditLogRepository.create({
            userId,
            action: actionMap[method],
            entity: this.extractEntityName(request.url),
            entityId: data?.id || null,
            ipAddress,
            userAgent,
            before: method !== 'POST' ? request.body : null,
            after: data,
            metadata: {
              url: request.url,
              params: request.params,
              query: request.query,
            },
          });

          await this.auditLogRepository.save(auditLog);
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      }),
    );
  }

  private extractEntityName(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'unknown';
  }
}
