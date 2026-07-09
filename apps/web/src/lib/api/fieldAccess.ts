/**
 * Read API response fields that may be camelCase or snake_case.
 */

export function toBooleanFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return false;
}

export function pickField(
  raw: Record<string, unknown>,
  camel: string,
  snake?: string
): unknown {
  if (raw[camel] !== undefined && raw[camel] !== null) {
    return raw[camel];
  }

  const snakeKey =
    snake ??
    camel.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

  if (raw[snakeKey] !== undefined && raw[snakeKey] !== null) {
    return raw[snakeKey];
  }

  return undefined;
}

export function pickString(
  raw: Record<string, unknown>,
  camel: string,
  snake?: string
): string | undefined {
  const value = pickField(raw, camel, snake);
  if (value === undefined || value === null || String(value).trim() === '') {
    return undefined;
  }
  return String(value);
}

export function pickNumber(
  raw: Record<string, unknown>,
  camel: string,
  snake?: string
): number | undefined {
  const value = pickField(raw, camel, snake);
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function pickStringArray(
  raw: Record<string, unknown>,
  camel: string,
  snake?: string
): string[] | undefined {
  const value = pickField(raw, camel, snake);
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.map(String);
}

export function pickRecord(
  raw: Record<string, unknown>,
  camel: string,
  snake?: string
): Record<string, unknown> | undefined {
  const value = pickField(raw, camel, snake);
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
