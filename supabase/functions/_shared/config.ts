/**
 * Centralized configuration for all Supabase Edge Functions.
 * All environment-specific values must come from Deno.env — never hard-code.
 */

export const SCRAPING_CONFIG = {
  network: {
    timeout: {
      connect: 10_000,   // 10 s
      read:    30_000,   // 30 s
      total:   60_000,   // 60 s (per individual HTTP call)
    },
    retries: {
      maxAttempts: 3,
      backoffBaseMs: 2_000,
      backoffMaxMs: 30_000,
      useJitter: true,
    },
    rateLimit: {
      requestsPerSecond: 1,
      perHostConcurrency: 2,
      globalConcurrency: 10,
    },
  },

  n8n: {
    webhookUrl:
      Deno.env.get('N8N_WEBHOOK_URL') ??
      (() => { throw new Error('N8N_WEBHOOK_URL environment variable is required'); })(),
    webhookToken: Deno.env.get('N8N_WEBHOOK_TOKEN'), // optional auth token
    timeoutMs: 1_500_000, // 25 min — full workflow completion window
    retries: 3,
  },

  validation: {
    maxSearchTermLength: 500,
    maxEntitiesPerBatch: 1_000,
    maxErrorMessageLength: 2_000,
  },

  sources: {
    allowedRegistries: ['COMPANIES_HOUSE', 'GLEIF', 'SEC_EDGAR', 'ASIC'] as const,
    sourceAliases: { CH: 'COMPANIES_HOUSE', SEC: 'SEC_EDGAR' } as Record<string, string>,
  },
} as const;

/** CORS headers applied to every response */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;

/**
 * Retry a fetch call with exponential back-off + optional jitter.
 * Stops early on 4xx client errors (except 429 rate-limit).
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: { maxAttempts?: number; baseMs?: number; maxMs?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const { maxAttempts = 3, baseMs = 2_000, maxMs = 30_000, timeoutMs = 60_000 } = options;
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (response.ok) return response;

      const status = response.status;
      // Don't retry on client errors (except 429)
      if (status >= 400 && status < 500 && status !== 429) {
        throw new Error(`HTTP ${status}: ${await response.text()}`);
      }

      lastError = new Error(`HTTP ${status}: ${await response.text()}`);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`);
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (attempt < maxAttempts) {
      const jitter = SCRAPING_CONFIG.network.retries.useJitter
        ? Math.random() * 1_000
        : 0;
      const delay = Math.min(baseMs * Math.pow(2, attempt - 1) + jitter, maxMs);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError;
}
