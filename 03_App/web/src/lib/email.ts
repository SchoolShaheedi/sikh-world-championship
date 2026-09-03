/**
 * Sending email, via Resend.
 *
 * Every send is recorded in `email_sends` before it is reported as done, because the
 * guardian notification is a safeguarding promise made publicly on /safeguarding. A
 * promise you cannot evidence is one you cannot defend.
 *
 * THREE THINGS THIS DELIBERATELY DOES NOT DO:
 *
 *  1. It never throws at the caller. An email failing must not roll back the thing that
 *     triggered it — a guardian approval that succeeded but reported an error would leave
 *     the child locked out for a reason nobody can see. Failures are recorded and
 *     surfaced to moderators instead.
 *  2. It never adds an unsubscribe link. These are transactional safeguarding notices; a
 *     guardian must not be able to opt out of being told what their child is doing.
 *  3. It does not store the message body. The kind and the context are enough to show
 *     what was sent, and keeping rendered text would copy a child's name into yet another
 *     table.
 */
import crypto from "node:crypto";
import { getDb } from "./db";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Falls back to the verified domain rather than failing closed on a missing var. */
function mailFrom(): string {
  return (
    process.env.MAIL_FROM ??
    "Sikh World Championships <no-reply@sikhchampionships.com>"
  );
}

/**
 * An address that actually receives mail, if one exists.
 *
 * WHY THIS IS HERE. We send from `no-reply@`, which has no mailbox behind it. Until
 * 2026-09-02 the footer of every email said "reply to this email", so a parent who
 * replied to a safeguarding notice got a bounce telling them our server was
 * misconfigured — which is a terrible thing to tell somebody who was trying to say
 * "this wasn't agreed with me".
 *
 * Two halves to fixing that, and this is the second one:
 *
 *  1. Stop inviting the reply, and say the mailbox is unattended. Done in the footer of
 *     every email, HTML and plain text, and it needs no DNS.
 *  2. Make a reply land somewhere anyway, because some people will reply regardless — to
 *     the address at the top of their mail client, not the link in the footer. Set
 *     `MAIL_REPLY_TO` to a real forwarding alias and every email carries it.
 *
 * Unset means no `Reply-To` header, which is the honest state: better to send nothing
 * than to advertise a second address that also bounces.
 */
function mailReplyTo(): string | null {
  const v = process.env.MAIL_REPLY_TO?.trim();
  return v ? v : null;
}

/**
 * Appended to the plain-text body of every email, so no template can forget it.
 *
 * The HTML version lives in `wrap()` in email-templates.ts. This is the text one, added
 * here rather than in eight templates for the same reason: a footer that has to be
 * remembered is a footer that goes missing from the one email that needed it.
 */
const TEXT_FOOTER = [
  "",
  "--",
  "This address does not receive email — a reply to it will not reach us.",
  "Tell us anything at https://sikhchampionships.com/support — no account needed,",
  "you do not have to give your name, and we read every message.",
].join("\n");

export interface SendResult {
  ok: boolean;
  /** True when an identical send was already recorded, so nothing was sent again. */
  duplicate?: boolean;
  providerId?: string;
  error?: string;
}

export interface EmailInput {
  kind: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  /**
   * Stops the same notification going twice on a retry, a double-click or a re-render.
   * Build it from the event, never from a timestamp.
   */
  idempotencyKey: string;
}

async function alreadySent(key: string): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT status FROM email_sends WHERE idempotency_key = ? AND status = 'sent'")
    .bind(key)
    .first<{ status: string }>();
  return row !== null;
}

async function record(
  input: EmailInput,
  status: "sent" | "failed",
  extra: { providerId?: string; error?: string },
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  // ON CONFLICT so a retry updates the existing attempt rather than failing on the
  // unique key — the attempt count is what tells a moderator this one is struggling.
  await db
    .prepare(
      `INSERT INTO email_sends
         (id, kind, to_email, subject, status, provider_id, error, attempts, created_at,
          sent_at, idempotency_key)
       VALUES (?,?,?,?,?,?,?,1,?,?,?)
       ON CONFLICT(idempotency_key) DO UPDATE SET
         status = excluded.status,
         provider_id = excluded.provider_id,
         error = excluded.error,
         attempts = email_sends.attempts + 1,
         sent_at = excluded.sent_at`,
    )
    .bind(
      crypto.randomUUID(),
      input.kind,
      input.to,
      input.subject,
      status,
      extra.providerId ?? null,
      extra.error ?? null,
      now,
      status === "sent" ? now : null,
      input.idempotencyKey,
    )
    .run();
}

/**
 * Send one email and record the outcome.
 *
 * With no API key configured — local development, or a deploy where the secret has not
 * been set — this logs and records a failure rather than pretending to succeed. Silence
 * that looks like success is exactly how the old stub hid the fact that nothing sent.
 */
export async function sendEmail(input: EmailInput): Promise<SendResult> {
  if (await alreadySent(input.idempotencyKey)) {
    return { ok: true, duplicate: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const error = "RESEND_API_KEY is not set — nothing was sent.";
    console.warn(`[email] ${input.kind} -> ${input.to}: ${error}`);
    /**
     * Locally, print what WOULD have gone out.
     *
     * The failure above is still a failure and still recorded as one — see the header; an
     * email that looks sent and was not is the bug this whole function is shaped around.
     * This only makes the content readable. `email_sends` keeps the kind, the recipient
     * and the subject but not the body, so before this the wording of an offer or a
     * guardian notice could not be checked anywhere except production, which for a
     * safeguarding email sent to a parent is the wrong place to first read it.
     *
     * Guarded on NODE_ENV rather than on a flag: a real child's details are in this text,
     * and the one environment where it must never reach a log is the one that has them.
     */
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `\n──────── ${input.kind} → ${input.to}\n` +
          `Subject: ${input.subject}\n\n${input.text}\n────────\n`,
      );
    }
    await record(input, "failed", { error });
    return { ok: false, error };
  }

  const replyTo = mailReplyTo();

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailFrom(),
        ...(replyTo ? { reply_to: [replyTo] } : {}),
        to: [input.to],
        subject: input.subject,
        text: input.text + TEXT_FOOTER,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      const error = `Resend returned ${res.status}: ${body.slice(0, 300)}`;
      console.error(`[email] ${input.kind} -> ${input.to}: ${error}`);
      await record(input, "failed", { error });
      return { ok: false, error };
    }

    const data = (await res.json()) as { id?: string };
    await record(input, "sent", { providerId: data.id });
    return { ok: true, providerId: data.id };
  } catch (e) {
    // Network failure, timeout, DNS. Recorded, never thrown — see the header.
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[email] ${input.kind} -> ${input.to}: ${error}`);
    await record(input, "failed", { error });
    return { ok: false, error };
  }
}

export interface FailedSend {
  id: string;
  kind: string;
  toEmail: string;
  subject: string;
  error: string | null;
  attempts: number;
  createdAt: string;
  idempotencyKey: string;
}

/**
 * Emails that did not go out.
 *
 * Shown in the moderation queue. A failed guardian notification is a safeguarding
 * incident, not an ops nicety: the connection happened and the one person who should know
 * does not.
 */
export async function failedSends(): Promise<FailedSend[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      "SELECT * FROM email_sends WHERE status = 'failed' ORDER BY created_at DESC LIMIT 50",
    )
    .all<Record<string, unknown>>();
  return results.map((r) => ({
    id: r.id as string,
    kind: r.kind as string,
    toEmail: r.to_email as string,
    subject: r.subject as string,
    error: (r.error as string | null) ?? null,
    attempts: r.attempts as number,
    createdAt: r.created_at as string,
    idempotencyKey: r.idempotency_key as string,
  }));
}
