import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { RoomType, RoomStatus } from '../entities/room.entity';

export class CreateRoomDto {
  @IsString()
  roomNumber: string;

  @IsNumber()
  @Min(0)
  @Max(20)
  floor: number;

  @IsEnum(RoomType)
  type: RoomType;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/)
  basePrice: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  maxOccupancy: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsString()
  viewType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
