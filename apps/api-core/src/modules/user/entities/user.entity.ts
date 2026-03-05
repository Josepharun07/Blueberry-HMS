import { Entity, Column, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';

@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @Column({ 
    name: 'keycloak_id', 
    type: 'varchar', 
    length: 255,
    nullable: true 
  })
  keycloakId: string | null;

  @Column({ 
    type: 'varchar', 
    length: 100,
    unique: true
  })
  email: string;

  @Column({ 
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false  // Don't select by default
  })
  @Exclude()  // Exclude from class-transformer serialization
  password: string | null;

  @Column({ 
    name: 'first_name', 
    type: 'varchar', 
    length: 100 
  })
  firstName: string;

  @Column({ 
    name: 'last_name', 
    type: 'varchar', 
    length: 100 
  })
  lastName: string;

  @Column({ 
    name: 'phone_number', 
    type: 'varchar', 
    length: 20, 
    nullable: true 
  })
  phoneNumber: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.GUEST,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ 
    name: 'profile_picture', 
    type: 'varchar',
    length: 500,
    nullable: true 
  })
  profilePicture: string | null;

  @Column({ 
    type: 'jsonb',
    nullable: true,
    default: {}
  })
  preferences: Record<string, any> | null;

  @Column({ 
    name: 'last_login_at', 
    type: 'timestamp', 
    nullable: true 
  })
  lastLoginAt: Date | null;

  @Column({ 
    name: 'last_login_ip', 
    type: 'varchar', 
    length: 45, 
    nullable: true 
  })
  lastLoginIp: string | null;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
