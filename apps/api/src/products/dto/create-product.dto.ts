import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToMoneyString } from '../../common/to-money-string';

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

  @ApiPropertyOptional({ example: '0', description: 'Optional list price. Defaults to 0.' })
  @IsOptional()
  @ToMoneyString()
  @IsString()
  @Matches(MONEY, { message: 'salePrice must be a valid amount' })
  salePrice?: string;

  @ApiPropertyOptional({ example: '0', description: 'Optional cost price. Defaults to 0.' })
  @IsOptional()
  @ToMoneyString()
  @IsString()
  @Matches(MONEY, { message: 'purchasePrice must be a valid amount' })
  purchasePrice?: string;
}
