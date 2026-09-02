/**
 * Tests for the email layer.
 *
 * The behaviours that matter are the safeguarding ones: a send is always recorded, a
 * failure is never thrown at the caller, and the same notice never goes twice.
 */
import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { sendEmail, failedSends } from "./email";
import { getDb } from "./db";

beforeAll(useTempDataDir);
beforeEach(async () => {
  await clearDataDir();
  process.env.RESEND_API_KEY = "test-key";
  vi.restoreAllMocks();
});
afterEach(() => {
  delete process.env.RESEND_API_KEY;
});

const mail = (over: Partial<Parameters<typeof sendEmail>[0]> = {}) => ({
  kind: "guardian-approval-request",
  to: "parent@example.com",
  subject: "Permission needed",
  text: "text body",
  html: "<p>html body</p>",
  idempotencyKey: "key-1",
  ...over,
});

function mockResend(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

/**
 * The unattended mailbox.
 *
 * We send from `no-reply@`, which has no mailbox. The footer used to say "reply to this
 * email", so a parent replying to a safeguarding notice got a bounce claiming our server
 * was misconfigured. These pin the fix: every email says the address is unattended, and a
 * Reply-To is only ever advertised when there is a real address to advertise.
 */
describe("replies", () => {
  async function sentBody(): Promise<Record<string, unknown>> {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ id: "e1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await sendEmail(mail());
    const call = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    return JSON.parse(call[1].body);
  }

  it("tells the reader the address does not receive email", async () => {
    const body = await sentBody();
    expect(body.text).toMatch(/does not receive email/i);
    // And still points somewhere that does.
    expect(body.text).toContain("sikhchampionships.com/support");
  });

  it("keeps the template's own body intact", async () => {
    const body = await sentBody();
    expect(body.text).toContain("text body");
  });

  it("sends no Reply-To when there is no address that works", async () => {
    delete process.env.MAIL_REPLY_TO;
    expect(await sentBody()).not.toHaveProperty("reply_to");
  });

  it("sends one when there is", async () => {
    process.env.MAIL_REPLY_TO = "hello@sikhchampionships.com";
    const body = await sentBody();
    expect(body.reply_to).toEqual(["hello@sikhchampionships.com"]);
    delete process.env.MAIL_REPLY_TO;
  });
});

describe("sending", () => {
  it("records a successful send with the provider id", async () => {
    mockResend(200, { id: "resend-abc" });
    const r = await sendEmail(mail());
    expect(r.ok).toBe(true);
    expect(r.providerId).toBe("resend-abc");

    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM email_sends WHERE idempotency_key = 'key-1'")
      .first<Record<string, unknown>>();
    expect(row!.status).toBe("sent");
    expect(row!.provider_id).toBe("resend-abc");
    expect(row!.sent_at).toBeTruthy();
  });

  it("posts to Resend with the right from address and no unsubscribe header", async () => {
    // A guardian must not be able to opt out of being told what their child is doing.
    const f = vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    process.env.MAIL_FROM = "SWC <no-reply@sikhchampionships.com>";

    await sendEmail(mail());

    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.from).toBe("SWC <no-reply@sikhchampionships.com>");
    expect(body.to).toEqual(["parent@example.com"]);
    // Both parts always present — some clients strip HTML, and a safeguarding notice
    // must never arrive blank.
    expect(body.text).toBeTruthy();
    expect(body.html).toBeTruthy();
    expect(JSON.stringify(body).toLowerCase()).not.toContain("unsubscribe");
    delete process.env.MAIL_FROM;
  });
});

describe("failure handling", () => {
  it("NEVER throws at the caller when Resend rejects", async () => {
    // An email failing must not roll back the thing that triggered it.
    mockResend(422, { message: "invalid" });
    await expect(sendEmail(mail())).resolves.toMatchObject({ ok: false });
  });

  it("NEVER throws when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("connect ETIMEDOUT"); }));
    const r = await sendEmail(mail());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ETIMEDOUT/);
  });

  it("records a failure so a moderator can see it", async () => {
    mockResend(500, { message: "boom" });
    await sendEmail(mail());

    const failures = await failedSends();
    expect(failures).toHaveLength(1);
    expect(failures[0].kind).toBe("guardian-approval-request");
    expect(failures[0].toEmail).toBe("parent@example.com");
    expect(failures[0].error).toMatch(/500/);
  });

  it("records a failure — not a silent success — when no API key is configured", async () => {
    // This is exactly how the old stub hid the fact that nothing sent.
    delete process.env.RESEND_API_KEY;
    const r = await sendEmail(mail());
    expect(r.ok).toBe(false);
    expect((await failedSends())[0].error).toMatch(/RESEND_API_KEY/);
  });

  it("counts attempts, so a repeatedly failing notice stands out", async () => {
    mockResend(500, { message: "boom" });
    await sendEmail(mail());
    await sendEmail(mail());
    await sendEmail(mail());
    expect((await failedSends())[0].attempts).toBe(3);
  });
});

describe("idempotency", () => {
  it("does not send the same notice twice", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 200 }));
    vi.stubGlobal("fetch", f);

    await sendEmail(mail());
    const second = await sendEmail(mail());

    expect(second).toMatchObject({ ok: true, duplicate: true });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("still retries something that FAILED", async () => {
    // Only a successful send blocks a repeat. A failure must remain retryable, or a
    // guardian notification lost to a blip is lost forever.
    mockResend(500, {});
    await sendEmail(mail());

    const f = vi.fn(async () => new Response(JSON.stringify({ id: "ok" }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    const r = await sendEmail(mail());

    expect(r.ok).toBe(true);
    expect(r.duplicate).toBeUndefined();
    expect(await failedSends()).toHaveLength(0);
  });

  it("treats a different notice as different", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await sendEmail(mail({ idempotencyKey: "key-1" }));
    await sendEmail(mail({ idempotencyKey: "key-2" }));
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("what is stored", () => {
  it("does not keep the message body", async () => {
    // The kind and context are enough to show what was sent; keeping rendered text would
    // copy a child's name into yet another table.
    mockResend(200, { id: "x" });
    await sendEmail(mail({ text: "SECRET-BODY-CANARY", html: "<p>SECRET-BODY-CANARY</p>" }));

    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM email_sends").all<Record<string, unknown>>();
    expect(JSON.stringify(results)).not.toContain("SECRET-BODY-CANARY");
  });
});
