import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReversePaymentDto {
  @ApiProperty({ description: 'Why this receipt is being corrected. This does not send money.' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  reason: string;
}
