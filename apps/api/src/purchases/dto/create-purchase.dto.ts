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

const MONEY = /^\d+(\.\d{1,4})?$/;

export class PurchaseItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '50' })
  @IsString()
  @Matches(MONEY)
  quantity!: string;

  @ApiProperty({ example: '120.00' })
  @IsString()
  @Matches(MONEY)
  unitPrice!: string;
}

export class CreatePurchaseDto {
  @ApiProperty()
  @IsUUID()
  supplierId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(MONEY)
  discount?: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  @Matches(MONEY)
  paidAmount?: string;

  @ApiPropertyOptional({ example: '5000' })
  @IsOptional()
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

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];
}
