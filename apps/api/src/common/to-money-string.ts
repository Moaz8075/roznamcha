import { Transform } from 'class-transformer';

/** Keep money as string even if JSON sends a number (e.g. 200 → "200"). */
export function ToMoneyString() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    return String(value);
  });
}
