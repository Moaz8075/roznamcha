import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';

Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

export { Decimal };

export function d(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export function moneyStr(value: Decimal | string | number): string {
  return new Decimal(value).toFixed(4);
}

export function assertPositiveMoney(
  value: string | number | Decimal,
  label = 'Amount',
) {
  const amount = d(value);
  if (!amount.isFinite() || amount.lte(0)) {
    throw new BadRequestException(`${label} must be greater than zero`);
  }
  return amount;
}
