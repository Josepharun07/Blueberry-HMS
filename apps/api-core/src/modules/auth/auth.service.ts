import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    if (this.config.get('ALLOW_PUBLIC_REGISTER') !== true) {
      throw new ForbiddenException('Registration is disabled');
    }

    const user = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: UserRole.GUEST,
    });

    return this.publicUser(user);
  }

  async login(
    loginDto: LoginDto,
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => void;
    },
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: loginDto.email })
      .getOne();

    const passwordOk =
      !!user?.password && (await bcrypt.compare(loginDto.password, user.password));

    if (!user || !passwordOk || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const csrf = randomBytes(32).toString('hex');
    const token = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      csrf,
    });
    this.writeSessionCookie(res, token);
    await this.userService.updateLastLogin(user.id, null);

    return {
      user: this.publicUser(user),
      csrfToken: csrf,
    };
  }

  logout(res: { clearCookie: (name: string, options: Record<string, unknown>) => void }) {
    res.clearCookie('bh_access', this.cookieOptions());
    return { ok: true };
  }

  private writeSessionCookie(
    res: { cookie: (name: string, value: string, options: Record<string, unknown>) => void },
    token: string,
  ) {
    res.cookie('bh_access', token, this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
      path: '/api/v1',
      maxAge: Number(this.config.getOrThrow('JWT_EXPIRES_MS')),
    };
  }

  private publicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    };
  }
}
