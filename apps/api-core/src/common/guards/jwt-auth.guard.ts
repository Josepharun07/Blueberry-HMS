import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log('🔒 JWT Guard - Authorization Header:', authHeader ? 'Present' : 'Missing');
    
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      console.log('❌ JWT Guard - Authentication failed');
      console.log('Error:', err?.message);
      console.log('Info:', info?.message);
      throw err || new UnauthorizedException('Invalid token');
    }
    
    console.log('✅ JWT Guard - User authenticated:', user.email);
    return user;
  }
}
