const RESEND_API = "https://api.resend.com/emails";

/**
 * Sends an email via Resend's REST API. Server-only — the API key never
 * leaves this module (never a NEXT_PUBLIC_ var, never sent to the client).
 */
export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or MAIL_FROM_EMAIL env var");
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Mail send failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
