import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory, ExpenseType, PaymentMethod } from '../../generated/prisma';
import { ToMoneyString } from '../../common/to-money-string';

const MONEY = /^\d+(\.\d{1,4})?$/;

export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseType })
  @IsEnum(ExpenseType)
  expenseType!: ExpenseType;

  @ApiProperty({
    enum: ExpenseCategory,
    description:
      'Business: LABOUR, FUEL, TRANSPORT, ELECTRICITY, RENT, OTHER. Personal: HOME, FAMILY, PERSONAL, OTHER.',
  })
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @ApiProperty({ example: '200.00' })
  @ToMoneyString()
  @IsString()
  @Matches(MONEY)
  amount!: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
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
