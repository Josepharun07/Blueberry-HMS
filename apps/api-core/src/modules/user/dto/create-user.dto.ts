import { IsEmail, IsString, IsEnum, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'staff@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: '+91-9876543210', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[+]?[0-9\s-()]+$/, { message: 'Invalid phone number format' })
  phoneNumber?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.FRONT_DESK })
  @IsEnum(UserRole)
  role: UserRole;
}
