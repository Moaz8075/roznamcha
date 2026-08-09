import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const MONEY = /^\d+(\.\d{1,4})?$/;

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'cft' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional({ example: '180.00' })
  @IsOptional()
  @IsString()
  @Matches(MONEY, { message: 'salePrice must be a valid amount' })
  salePrice?: string;

  @ApiPropertyOptional({ example: '140.00' })
  @IsOptional()
  @IsString()
  @Matches(MONEY, { message: 'purchasePrice must be a valid amount' })
  purchasePrice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
