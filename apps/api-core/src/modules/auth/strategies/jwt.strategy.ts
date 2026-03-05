import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    
    console.log('🔑 JWT Strategy initialized');
    console.log('JWT_SECRET exists:', !!secret);
    
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('🔍 Validating JWT payload:', { sub: payload.sub, email: payload.email, role: payload.role });
    
    try {
      const user = await this.userService.findOne(payload.sub);
      
      if (!user) {
        console.log('❌ User not found:', payload.sub);
        throw new UnauthorizedException('User not found');
      }

      if (user.status !== 'ACTIVE') {
        console.log('❌ User not active:', user.email, user.status);
        throw new UnauthorizedException('User account is not active');
      }

      console.log('✅ User validated:', user.email);
      return user;
    } catch (error) {
      console.log('❌ Validation error:', error.message);
      throw error;
    }
  }
}
