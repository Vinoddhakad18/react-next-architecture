/**
 * Convert object keys to snake_case for API request payloads.
 */

export function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toSnakeCaseKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => toSnakeCaseKeys(item)) as T;
  }

  if (value !== null && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        camelToSnake(key),
        toSnakeCaseKeys(nested),
      ])
    ) as T;
  }

  return value;
}
