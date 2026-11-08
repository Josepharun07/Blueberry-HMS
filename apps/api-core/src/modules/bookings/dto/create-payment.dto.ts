import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Amount received, as a decimal string in rupees. Never a float.',
    example: '1500.00',
  })
  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/, {
    message: 'amount must be a decimal string with at most 2 fraction digits',
  })
  amount: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false, description: 'Receipt or UPI reference. Not a card number.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
