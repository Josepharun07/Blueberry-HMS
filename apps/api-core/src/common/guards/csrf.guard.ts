import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cookie-authenticated mutations must echo the csrf claim from the session.
 * A browser cannot attach an Authorization header cross-site, so bearer
 * clients are not subject to this check.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic || SAFE_METHODS.has(request.method)) {
      return true;
    }

    const authorization = request.headers?.authorization;
    if (typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ')) {
      return true;
    }

    const header = request.headers?.['x-csrf-token'];
    const expected = request.user?.csrf;
    if (typeof header !== 'string' || !expected || header !== expected) {
      throw new ForbiddenException('Missing or invalid CSRF token');
    }
    return true;
  }
}
