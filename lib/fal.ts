const FAL_BASE = "https://queue.fal.run";

type FalSubmitResponse = {
  request_id: string;
  status_url: string;
  response_url: string;
};

async function falFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(`fal.ai request failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/**
 * Retries transient failures (network blips, momentary 5xx) a bounded
 * number of times — never indefinitely — so a single flaky request
 * doesn't kill an otherwise-successful generation, but a genuinely broken
 * call still fails fast instead of hammering fal.ai forever.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { attempts?: number; delayMs?: number }
): Promise<T> {
  const attempts = opts?.attempts ?? 3;
  const delayMs = opts?.delayMs ?? 1500;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

export async function submitFal(
  modelId: string,
  input: Record<string, unknown>
): Promise<FalSubmitResponse> {
  return withRetry(() =>
    falFetch(`${FAL_BASE}/${modelId}`, {
      method: "POST",
      body: JSON.stringify(input),
    })
  );
}

/**
 * Polls a fal.ai queue job until it completes, then fetches and returns the
 * result. fal.ai also supports webhooks (`fal_webhook` query param on
 * submit), which would be the production-grade approach, but that needs a
 * publicly reachable callback URL — polling works the same in local dev and
 * on a long-lived server, so it's used here instead.
 */
export async function waitForFal(
  statusUrl: string,
  responseUrl: string,
  opts?: { intervalMs?: number; timeoutMs?: number }
): Promise<Record<string, unknown>> {
  const intervalMs = opts?.intervalMs ?? 4000;
  const timeoutMs = opts?.timeoutMs ?? 6 * 60 * 1000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const status = (await withRetry(() => falFetch(statusUrl))) as {
      status: string;
      error?: unknown;
    };
    if (status.status === "COMPLETED") {
      return withRetry(() => falFetch(responseUrl));
    }
    if (status.status === "ERROR") {
      throw new Error(`fal.ai generation failed: ${JSON.stringify(status)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("fal.ai generation timed out");
}
