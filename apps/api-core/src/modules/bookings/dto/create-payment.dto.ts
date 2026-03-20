import { IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 5000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ 
    description: 'Payment method', 
    enum: PaymentMethod,
    example: PaymentMethod.CASH 
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ 
    description: 'Payment reference number', 
    required: false,
    example: 'TXN123456' 
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ 
    description: 'Additional notes', 
    required: false 
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
