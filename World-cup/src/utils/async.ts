export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i <= maxRetries; i++) {
    try { return await fn(); } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (i < maxRetries) await sleep(delayMs);
    }
  }
  throw lastError;
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 5, baseMs = 500, maxMs = 30000): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i <= maxRetries; i++) {
    try { return await fn(); } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (i < maxRetries) {
        const delay = Math.min(baseMs * Math.pow(2, i) + Math.random() * baseMs, maxMs);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

export async function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms)),
  ]);
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

export async function batch<T>(items: T[], batchSize: number, fn: (batch: T[]) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    await fn(items.slice(i, i + batchSize));
  }
}

export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.reduce<T[]>((acc, val) => acc.concat(Array.isArray(val) ? val : [val]), []);
}

export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

export function sortBy<T>(arr: T[], keyFn: (item: T) => number, desc = false): T[] {
  return [...arr].sort((a, b) => desc ? keyFn(b) - keyFn(a) : keyFn(a) - keyFn(b));
}

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function uniqueBy<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
