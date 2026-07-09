/**
 * Safe response body parsing helpers.
 */

export function parseJsonText(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  return JSON.parse(trimmed);
}

export function readErrorMessage(text: string, fallback: string): string {
  if (!text.trim()) {
    return fallback;
  }

  try {
    const data = parseJsonText(text) as { message?: string } | null;
    return data?.message || fallback;
  } catch {
    return text;
  }
}

export async function readJsonResponse(response: Response): Promise<unknown | null> {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return parseJsonText(text);
  } catch {
    return null;
  }
}

export function isJsonContentType(contentType: string | null): boolean {
  return (contentType ?? '').includes('application/json');
}
