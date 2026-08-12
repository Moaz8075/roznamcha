import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentDirection, PaymentMethod } from '../../generated/prisma';
import { ToMoneyString } from '../../common/to-money-string';

const MONEY = /^\d+(\.\d{1,4})?$/;

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentDirection })
  @IsEnum(PaymentDirection)
  direction!: PaymentDirection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiProperty({ example: '500.00' })
  @ToMoneyString()
  @IsString()
  @Matches(MONEY)
  amount!: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
