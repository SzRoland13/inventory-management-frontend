export function createIdempotencyKey(): string {
  const cryptoApi = globalThis.crypto;

  try {
    if (typeof cryptoApi?.randomUUID === 'function') {
      return cryptoApi.randomUUID();
    }

    if (typeof cryptoApi?.getRandomValues === 'function') {
      return Array.from(cryptoApi.getRandomValues(new Uint8Array(16)))
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fall back to a best-effort unique key if browser crypto is unavailable.
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
