import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Blueberry Hills Resort' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'A quiet stay', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tagline?: string;

  @ApiProperty({ example: 'resort.example' })
  @IsString()
  @MaxLength(100)
  domainUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Town', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'State', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '000000', required: false })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiProperty({ example: 'India', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: '+91-XXXXXXXXXX', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'front-desk@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
