import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../generated/prisma';
import { ToMoneyString } from '../../common/to-money-string';

const MONEY = /^\d+(\.\d{1,4})?$/;

export class SaleItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '10' })
  @ToMoneyString()
  @IsString()
  @Matches(MONEY)
  quantity!: string;

  @ApiProperty({ example: '150.00' })
  @ToMoneyString()
  @IsString()
  @Matches(MONEY)
  unitPrice!: string;
}

export class CreateSaleDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @ToMoneyString()
  @IsString()
  @Matches(MONEY)
  discount?: string;

  @ApiPropertyOptional({
    example: '0',
    description: 'Amount collected now. Omit with creditAmount for full credit.',
  })
  @IsOptional()
  @ToMoneyString()
  @IsString()
  @Matches(MONEY)
  paidAmount?: string;

  @ApiPropertyOptional({
    example: '1000',
    description: 'Amount on customer khata. If omitted, total − paidAmount.',
  })
  @IsOptional()
  @ToMoneyString()
  @IsString()
  @Matches(MONEY)
  creditAmount?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];
}
