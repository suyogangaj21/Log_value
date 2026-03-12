// lib/cr-api/rate-limiter.ts
// Token bucket rate limiter — Supercell developer tier: 10 req/s per key

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const RATE = 10; // tokens per second
const CAPACITY = 10; // burst capacity
const RETRY_LIMIT = 3;

const bucket: TokenBucket = {
  tokens: CAPACITY,
  lastRefill: Date.now(),
};

function refill() {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000; // seconds
  bucket.tokens = Math.min(CAPACITY, bucket.tokens + elapsed * RATE);
  bucket.lastRefill = now;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Acquire a token, waiting if necessary. Returns when a token is available.
 */
export async function acquireToken(): Promise<void> {
  for (let attempt = 0; attempt < RETRY_LIMIT * 10; attempt++) {
    refill();
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return;
    }
    // Wait for the next token to be available
    const waitMs = Math.ceil(((1 - bucket.tokens) / RATE) * 1000) + 10;
    await sleep(waitMs);
  }
  throw new Error(
    "Rate limiter: unable to acquire token after maximum retries",
  );
}
