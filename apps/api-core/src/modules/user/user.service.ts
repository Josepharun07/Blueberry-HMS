import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, actor?: { role: UserRole }): Promise<User> {
    this.assertRoleGrant(createUserDto.role, actor);

    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
      withDeleted: true,
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException('Email already registered');
    }

    const password = await bcrypt.hash(createUserDto.password, 12);
    const user = this.userRepository.create({ ...createUserDto, password });
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return await this.userRepository.find({
      where: { role, status: UserStatus.ACTIVE },
      order: { firstName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { email },
      select: [
        'id', 
        'email', 
        'password', 
        'firstName', 
        'lastName', 
        'role', 
        'status',
        'keycloakId',
        'phoneNumber',
        'profilePicture',
        'preferences',
        'lastLoginAt',
        'lastLoginIp',
        'createdAt',
        'updatedAt',
        'deletedAt'
      ]
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, actor?: { role: UserRole }): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.role) {
      this.assertRoleGrant(updateUserDto.role, actor);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('Email already in use');
      }
    }

    const next = { ...updateUserDto };
    if (next.password) {
      next.password = await bcrypt.hash(next.password, 12);
    }

    Object.assign(user, next);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  async updateLastLogin(userId: string, ipAddress: string | null): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });
  }

  private assertRoleGrant(role: UserRole, actor?: { role: UserRole }) {
    if (role === UserRole.SUPER_ADMIN && actor?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a super admin can grant that role');
    }
  }
}
