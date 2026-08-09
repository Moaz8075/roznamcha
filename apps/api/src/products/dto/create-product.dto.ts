import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const MONEY = /^\d+(\.\d{1,4})?$/;

export class CreateProductDto {
  @ApiProperty({ example: 'Sheesham Plank' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ default: 'cft', example: 'cft' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @ApiProperty({ example: '180.00' })
  @IsString()
  @Matches(MONEY, { message: 'salePrice must be a valid amount' })
  salePrice!: string;

  @ApiProperty({ example: '140.00' })
  @IsString()
  @Matches(MONEY, { message: 'purchasePrice must be a valid amount' })
  purchasePrice!: string;
}
