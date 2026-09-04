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
 * With no API key, nothing is sent — and the TEXT is printed, but only off production.
 *
 * The failure recording is unchanged and must stay that way: an email that looks sent and
 * was not is the bug this module is shaped around. What was missing is that `email_sends`
 * keeps the kind, the recipient and the subject and NOT the body, so the wording of an
 * offer or a guardian notice could not be read anywhere but production — which for a
 * safeguarding email to a parent is the wrong place to read it first.
 */
/**
 * A key IS configured on the developer's machine — `.envrc` loads it from the Keychain —
 * so "no key" was never the local case. These pin the case that actually happens.
 */
describe("running under next dev, with a key present", () => {
  it("does NOT call Resend, and prints the email instead", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const before = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "development");

    const r = await sendEmail(
      mail({ text: "Here is your sign-in link:\n\nhttp://localhost:3000/signin/abc" }),
    );

    // The whole point: a rehearsal on a laptop must not put real email in a real inbox.
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(r.ok).toBe(false);
    expect(warn.mock.calls.flat().join(" ")).toContain("http://localhost:3000/signin/abc");

    // Recorded as failed, because it was not delivered. Only a 200 records 'sent'.
    const rows = await failedSends();
    expect(rows).toHaveLength(1);

    vi.stubEnv("NODE_ENV", before ?? "test");
    warn.mockRestore();
  });

  it("sends for real when SWC_EMAIL_DEV_SEND is set, for anyone who means it", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.SWC_EMAIL_DEV_SEND = "true";
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ id: "e9" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const before = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "development");

    const r = await sendEmail(mail({ idempotencyKey: "key-dev-send" }));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(r.ok).toBe(true);

    vi.stubEnv("NODE_ENV", before ?? "test");
    delete process.env.SWC_EMAIL_DEV_SEND;
  });

  it("still sends under `test`, so the suite keeps testing the real path", async () => {
    // The guard is on `development` and not on `!== "production"` for exactly this reason.
    process.env.RESEND_API_KEY = "test-key";
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ id: "e8" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await sendEmail(mail({ idempotencyKey: "key-test-env" }));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(r.ok).toBe(true);
  });
});

describe("no API key configured", () => {
  it("records a FAILURE and prints the body, in development", async () => {
    delete process.env.RESEND_API_KEY;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const before = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "development");

    const r = await sendEmail(
      mail({ text: "Here is your sign-in link:\n\nhttp://localhost:3000/signin/abc" }),
    );
    expect(r.ok).toBe(false);

    const said = warn.mock.calls.flat().join(" ");
    expect(said).toContain("http://localhost:3000/signin/abc");
    expect(said).toContain("Permission needed");

    // Still recorded as failed. The console is a convenience, not a delivery.
    const rows = await failedSends();
    expect(rows).toHaveLength(1);

    vi.stubEnv("NODE_ENV", before ?? "test");
    warn.mockRestore();
  });

  it("does NOT print the body in production — a child's details are in that text", async () => {
    delete process.env.RESEND_API_KEY;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const before = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");

    await sendEmail(mail({ text: "Amritpal, born 2013-04-12, 07700900123" }));
    expect(warn.mock.calls.flat().join(" ")).not.toContain("07700900123");

    vi.stubEnv("NODE_ENV", before ?? "test");
    warn.mockRestore();
  });
});

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
