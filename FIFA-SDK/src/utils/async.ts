/** Async control utilities for SDK operations. */

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs),
  );
  return Promise.race([promise, timeout]);
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt);
      }
    }
  }
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function allSettledMap<K, V>(
  keys: K[],
  fn: (key: K) => Promise<V>,
): Promise<Map<K, V | Error>> {
  const results = await Promise.allSettled(keys.map(k => fn(k)));
  const map = new Map<K, V | Error>();
  keys.forEach((key, i) => {
    const result = results[i]!;
    map.set(key, result.status === 'fulfilled' ? result.value : result.reason);
  });
  return map;
}
