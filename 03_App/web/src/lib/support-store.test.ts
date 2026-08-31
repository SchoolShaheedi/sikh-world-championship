import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { createTicket, allTickets, updateTicket, supportHealth } from "./support-store";
import { SUPPORT_CATEGORIES, categoryById } from "./support-types";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const ticket = (over = {}) => ({
  category: "technical" as const,
  urgent: false,
  subject: "Something",
  message: "A message long enough to be useful.",
  name: null,
  email: null,
  playerId: null,
  fromGuardian: false,
  ...over,
});

describe("support categories", () => {
  it("marks safety and player reports as urgent, and nothing else", () => {
    const urgent = SUPPORT_CATEGORIES.filter((c) => c.urgent).map((c) => c.id);
    expect(urgent.sort()).toEqual(["player", "safety"]);
  });

  it("looks up a category, and returns nothing for an unknown one", () => {
    expect(categoryById("safety")?.urgent).toBe(true);
    expect(categoryById("nonsense")).toBeUndefined();
  });
});

describe("ticket queue", () => {
  it("accepts a ticket with no name and no email", async () => {
    // A worried parent who has never logged in is the most important message we get.
    const t = await createTicket(ticket({ category: "safety", urgent: true }));
    expect(t.name).toBeNull();
    expect(t.email).toBeNull();
    expect(t.reference).toMatch(/^SUP-[0-9A-F]{4}$/);
  });

  it("puts urgent tickets ahead of ordinary ones", async () => {
    await createTicket(ticket({ subject: "Broken button" }));
    await createTicket(ticket({ category: "safety", urgent: true, subject: "Concern" }));

    const sorted = await allTickets();
    expect(sorted[0].subject).toBe("Concern");
  });

  it("puts unhandled tickets ahead of resolved ones", async () => {
    const a = await createTicket(ticket({ category: "safety", urgent: true, subject: "Old urgent" }));
    await createTicket(ticket({ subject: "New ordinary" }));
    await updateTicket(a.id, { status: "resolved" });

    const sorted = await allTickets();
    expect(sorted[0].subject).toBe("New ordinary");
  });

  it("counts urgent open tickets separately", async () => {
    await createTicket(ticket());
    await createTicket(ticket({ category: "safety", urgent: true }));

    const health = await supportHealth();
    expect(health.open).toBe(2);
    expect(health.urgentOpen).toBe(1);
    expect(health.oldestUrgentHours).toBe(0);
  });

  it("stops counting a ticket once it's resolved", async () => {
    const t = await createTicket(ticket({ category: "safety", urgent: true }));
    await updateTicket(t.id, { status: "resolved" });

    const health = await supportHealth();
    expect(health.urgentOpen).toBe(0);
    expect(health.oldestUrgentHours).toBeNull();
  });

  it("records who handled a ticket and when", async () => {
    const t = await createTicket(ticket());
    const updated = await updateTicket(t.id, {
      status: "resolved",
      assignedTo: "Mod One",
      resolution: "Fixed.",
    });
    expect(updated?.assignedTo).toBe("Mod One");
    expect(updated?.handledAt).not.toBeNull();
  });

  it("gives every ticket a unique reference", async () => {
    const refs = new Set<string>();
    for (let i = 0; i < 40; i++) refs.add((await createTicket(ticket())).reference);
    expect(refs.size).toBe(40);
  });
});

/**
 * The volunteer page deep-links to /support?about=volunteer. If that id ever drifts from
 * the category list the link silently falls back to the safeguarding category, which is
 * the wrong queue for "I'd like to help on the day" — and it lands as urgent-adjacent
 * noise in front of a moderator looking for real concerns.
 */
describe("the volunteering category", () => {
  it("exists, is addressable by the id the volunteer page links to, and is not urgent", () => {
    const category = categoryById("volunteer");
    expect(category).toBeDefined();
    expect(category!.urgent).toBe(false);
  });

  it("is not the default — the safeguarding category is", () => {
    expect(SUPPORT_CATEGORIES[0].id).toBe("safety");
    expect(SUPPORT_CATEGORIES[0].urgent).toBe(true);
  });
});
