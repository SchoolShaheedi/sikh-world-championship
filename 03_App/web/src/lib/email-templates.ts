/**
 * Email content.
 *
 * Written for the person receiving them, who is usually a parent who has never heard of
 * us, reading on a phone, deciding in about fifteen seconds whether this is legitimate.
 * Every template therefore:
 *
 *  - says Sikh World Championship in the first line, not just the from-address
 *  - names their child, so it is obviously not a mass mailing
 *  - says what is being asked and what happens if they ignore it
 *  - gives a real human contact
 *
 * The old code comment on the approval email put it exactly right: "a bare link from an
 * unknown sender gets deleted". That is the failure mode these are written against.
 *
 * Plain text is generated alongside the HTML for every one. Some parents read in clients
 * that strip HTML, and a safeguarding notice must not be the email that arrives blank.
 */
import { GUARDIAN_TERMS } from "./guardian-types";

const BRAND = "Sikh World Championship";

/** Minimal, inline-styled, single column. Email clients are not browsers. */
function wrap(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f6f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
                    color:#1a1a1a;line-height:1.55;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8a6d1f;">${BRAND}</p>
          <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;">${heading}</h1>
          ${bodyHtml}
          <hr style="border:none;border-top:1px solid #e6e6e2;margin:26px 0 14px;">
          <p style="margin:0;font-size:12px;color:#6b6b66;">
            ${BRAND} — competitions for Sikhs.<br>
            Questions, or think you got this by mistake? Reply to this email or visit
            <a href="https://sikhchampionships.com/support" style="color:#8a6d1f;">sikhchampionships.com/support</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:22px 0;">
     <a href="${href}" style="display:inline-block;background:#c8891a;color:#ffffff;
        text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:700;">${label}</a>
   </p>`;

export interface Rendered {
  subject: string;
  text: string;
  html: string;
}

/**
 * Asking a guardian for permission. The most important email the system sends: a child's
 * access depends on it, and it goes to someone who did not ask to hear from us.
 */
export function guardianApprovalRequest(n: {
  childDisplayName: string;
  approvalUrl: string;
}): Rendered {
  const subject = `Permission needed for ${n.childDisplayName} — ${BRAND}`;
  const terms = GUARDIAN_TERMS;

  const text = [
    `${BRAND}`,
    ``,
    `${n.childDisplayName} has asked to use our "Find a game" board, which helps Sikh`,
    `players find someone to practise against. They need your permission first.`,
    ``,
    `We have your email because it was given when ${n.childDisplayName} registered for one`,
    `of our events.`,
    ``,
    `What you would be agreeing to:`,
    ...terms.map((t) => `  - ${t}`),
    ``,
    `Say yes or no here: ${n.approvalUrl}`,
    ``,
    `You do not need an account or a password. If you do nothing, ${n.childDisplayName}`,
    `simply does not get access — the link expires in 30 days. You can change your mind at`,
    `any time using the same link.`,
    ``,
    `Questions: https://sikhchampionships.com/support`,
  ].join("\n");

  const html = wrap(
    `${n.childDisplayName} needs your permission`,
    `<p style="margin:0 0 14px;">
       <strong>${n.childDisplayName}</strong> has asked to use our &ldquo;Find a game&rdquo;
       board, which helps Sikh players find someone to practise against. They need your
       permission first.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       We have your email because it was given when ${n.childDisplayName} registered for one
       of our events.
     </p>
     <p style="margin:18px 0 8px;font-weight:700;">What you would be agreeing to</p>
     <ul style="margin:0;padding-left:20px;font-size:14px;">
       ${terms.map((t) => `<li style="margin-bottom:7px;">${t}</li>`).join("")}
     </ul>
     ${button(n.approvalUrl, "Say yes or no")}
     <p style="margin:0;font-size:14px;color:#55554f;">
       No account or password needed. If you do nothing, ${n.childDisplayName} simply does
       not get access — the link expires in 30 days. You can change your mind at any time
       using the same link.
     </p>`,
  );

  return { subject, text, html };
}

/**
 * Telling a guardian their child has connected with another player.
 *
 * Informative rather than blocking, by design: a guardian who can see what is happening
 * can step in early. It is sent to BOTH children's guardians — see play-types.ts.
 */
export function guardianConnectionNotice(n: {
  childDisplayName: string;
  otherPlayerName: string;
  otherPlayerRegion: string;
  game: string;
  when: string;
}): Rendered {
  const subject = `${n.childDisplayName} has arranged a game — ${BRAND}`;

  const text = [
    `${BRAND}`,
    ``,
    `${n.childDisplayName} has arranged a game with another player. We tell you every time`,
    `this happens, so you always know who your child is playing with.`,
    ``,
    `  Player:   ${n.otherPlayerName}`,
    `  From:     ${n.otherPlayerRegion}`,
    `  Game:     ${n.game}`,
    `  When:     ${n.when}`,
    ``,
    `Both players are under 16 — our board never mixes age groups, and adults cannot see or`,
    `contact under-16 players at all. They have swapped PlayStation IDs so they can play;`,
    `the game itself happens on PlayStation, not on our website.`,
    ``,
    `If anything concerns you, you can withdraw permission at any time using the link from`,
    `your original approval email, and access stops immediately.`,
    ``,
    `Report a concern: https://sikhchampionships.com/support`,
  ].join("\n");

  const html = wrap(
    `${n.childDisplayName} has arranged a game`,
    `<p style="margin:0 0 14px;">
       We tell you every time this happens, so you always know who your child is playing with.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0"
            style="margin:0 0 16px;font-size:14px;border-collapse:collapse;">
       ${[
         ["Player", n.otherPlayerName],
         ["From", n.otherPlayerRegion],
         ["Game", n.game],
         ["When", n.when],
       ]
         .map(
           ([k, v]) =>
             `<tr><td style="padding:5px 18px 5px 0;color:#6b6b66;">${k}</td>
                  <td style="padding:5px 0;font-weight:600;">${v}</td></tr>`,
         )
         .join("")}
     </table>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       Both players are under 16 — our board never mixes age groups, and adults cannot see
       or contact under-16 players at all. They have swapped PlayStation IDs so they can
       play; the game itself happens on PlayStation, not on our website.
     </p>
     <p style="margin:0;font-size:14px;color:#55554f;">
       If anything concerns you, you can withdraw permission at any time using the link from
       your original approval email, and access stops immediately.
     </p>`,
  );

  return { subject, text, html };
}

/** Confirming a decision back to the guardian, so a change they did not make is visible. */
export function guardianDecisionConfirmed(n: {
  childDisplayName: string;
  decision: string;
}): Rendered {
  const readable: Record<string, string> = {
    approved: "given permission",
    declined: "declined permission",
    revoked: "withdrawn permission",
  };
  const what = readable[n.decision] ?? n.decision;
  const subject = `You have ${what} for ${n.childDisplayName} — ${BRAND}`;

  const text = [
    `${BRAND}`,
    ``,
    `This confirms that you have ${what} for ${n.childDisplayName} to use our`,
    `"Find a game" board.`,
    ``,
    n.decision === "approved"
      ? `They can now use it. You can withdraw permission at any time using the same link.`
      : `They cannot use it. You can change your mind at any time using the same link.`,
    ``,
    `If this was not you, tell us straight away: https://sikhchampionships.com/support`,
  ].join("\n");

  const html = wrap(
    `Permission ${n.decision}`,
    `<p style="margin:0 0 14px;">
       This confirms that you have <strong>${what}</strong> for
       <strong>${n.childDisplayName}</strong> to use our &ldquo;Find a game&rdquo; board.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       ${
         n.decision === "approved"
           ? "They can now use it. You can withdraw permission at any time using the same link."
           : "They cannot use it. You can change your mind at any time using the same link."
       }
     </p>
     <p style="margin:0;font-size:14px;color:#55554f;">
       If this was not you, tell us straight away at
       <a href="https://sikhchampionships.com/support" style="color:#8a6d1f;">sikhchampionships.com/support</a>.
     </p>`,
  );

  return { subject, text, html };
}


/**
 * The sign-in link.
 *
 * Short by design: it arrives seconds after someone clicked a button, so it needs to say
 * what it is and get out of the way. The security note is there because a link that
 * expires quickly looks broken to someone who comes back to it an hour later.
 */
export function signInLink(n: {
  displayName: string;
  url: string;
  minutes: number;
}): Rendered {
  const subject = `Your sign-in link — ${BRAND}`;

  const text = [
    `${BRAND}`,
    ``,
    `Hi ${n.displayName},`,
    ``,
    `Here is your sign-in link. It works once and expires in ${n.minutes} minutes:`,
    ``,
    n.url,
    ``,
    `If you did not ask to sign in, you can ignore this — nobody can get into your account`,
    `without this link, and it will stop working shortly.`,
    ``,
    `Questions: https://sikhchampionships.com/support`,
  ].join("\n");

  const html = wrap(
    `Sign in to ${BRAND}`,
    `<p style="margin:0 0 14px;">Hi ${n.displayName},</p>
     <p style="margin:0 0 4px;">
       Here is your sign-in link. It works once and expires in ${n.minutes} minutes.
     </p>
     ${button(n.url, "Sign in")}
     <p style="margin:0;font-size:14px;color:#55554f;">
       If you did not ask to sign in, ignore this. Nobody can get into your account without
       this link, and it stops working shortly.
     </p>`,
  );

  return { subject, text, html };
}


/**
 * The outcome of an application.
 *
 * The "not selected" version matters more than the other one. It goes to a young person
 * who put their details in and did not get a place, and the difference between "you were
 * not chosen" and "there were more applications than places, and it was a draw" is the
 * difference between feeling judged and understanding what happened.
 */
export function applicationOutcome(n: {
  selected: boolean;
  displayName: string;
  eventTitle: string;
  eventDate: string | null;
  reference: string;
}): Rendered {
  const when = n.eventDate
    ? new Date(n.eventDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "the event date";

  if (n.selected) {
    const subject = `You have a place — ${n.eventTitle}`;
    const text = [
      `${BRAND}`,
      ``,
      `Good news ${n.displayName} — you have a place at ${n.eventTitle} on ${when}.`,
      ``,
      `Your reference is ${n.reference}. Keep it; you will need it at the desk.`,
      ``,
      `We have created your SWC profile so your results and trophies are saved across`,
      `every event you play in. You can sign in at any time at`,
      `https://sikhchampionships.com/signin using this email address — no password.`,
      ``,
      `We will email again with the venue address and what to bring.`,
      ``,
      `Can't make it any more? Tell us as soon as you can so we can offer your place to`,
      `someone else: https://sikhchampionships.com/support`,
    ].join("\n");

    const html = wrap(
      `You have a place`,
      `<p style="margin:0 0 14px;">
         Good news ${n.displayName} — you have a place at <strong>${n.eventTitle}</strong>
         on ${when}.
       </p>
       <p style="margin:0 0 14px;">
         Your reference is <strong style="font-family:monospace;">${n.reference}</strong>.
         Keep it; you will need it at the desk.
       </p>
       <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
         We have created your SWC profile so your results and trophies are saved across every
         event you play in. Sign in any time with this email address — no password.
       </p>
       ${button("https://sikhchampionships.com/signin", "Sign in to your profile")}
       <p style="margin:0;font-size:14px;color:#55554f;">
         We will email again with the venue address and what to bring. If you can no longer
         come, tell us as soon as you can so we can offer your place to someone else.
       </p>`,
    );
    return { subject, text, html };
  }

  const subject = `Your application — ${n.eventTitle}`;
  const text = [
    `${BRAND}`,
    ``,
    `Hi ${n.displayName},`,
    ``,
    `We had more applications than places for ${n.eventTitle}, so places were decided by a`,
    `draw. You did not get one this time.`,
    ``,
    `This is not a judgement about you — everyone eligible went into the same draw.`,
    ``,
    `We would genuinely like to see you at the next one, and we will email you when it is`,
    `announced. If a place frees up before ${when} we will be in touch.`,
    ``,
    `Your reference was ${n.reference}.`,
  ].join("\n");

  const html = wrap(
    `About your application`,
    `<p style="margin:0 0 14px;">Hi ${n.displayName},</p>
     <p style="margin:0 0 14px;">
       We had more applications than places for <strong>${n.eventTitle}</strong>, so places
       were decided by a draw. You did not get one this time.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       This is not a judgement about you — everyone eligible went into the same draw.
     </p>
     <p style="margin:0;font-size:14px;color:#55554f;">
       We would genuinely like to see you at the next one, and we will email you when it is
       announced. If a place frees up before ${when} we will be in touch.
     </p>`,
  );
  return { subject, text, html };
}
