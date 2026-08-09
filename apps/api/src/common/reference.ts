import { REFERENCE_PREFIXES } from '@roznamcha/constants';

type PrefixKey = keyof typeof REFERENCE_PREFIXES;

export function buildReference(prefix: PrefixKey, seq: number): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${REFERENCE_PREFIXES[prefix]}-${y}${m}${d}-${String(seq).padStart(4, '0')}`;
}
