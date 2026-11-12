import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  guestId: string;

  @ApiProperty()
  @IsUUID()
  roomId: string;

  @ApiProperty({ example: '2026-12-24' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  checkInDate: string;

  @ApiProperty({ example: '2026-12-26' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  checkOutDate: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(10)
  numberOfGuests: number;

  @ApiProperty({ required: false, description: 'Basis points. 100 = 1%. Managers only.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  discountBasisPoints?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  discountReason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequests?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNotes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  bookingSource?: string;
}
