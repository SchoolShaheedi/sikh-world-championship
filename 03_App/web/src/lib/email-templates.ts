/**
 * Email content.
 *
 * Written for the person receiving them, who is usually a parent who has never heard of
 * us, reading on a phone, deciding in about fifteen seconds whether this is legitimate.
 * Every template therefore:
 *
 *  - says Sikh World Championships in the first line, not just the from-address
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
import { ID_REQUIREMENT, ID_PHOTO_ALLOWED, ID_WE_KEEP_NOTHING } from "@/data/id-check";

const BRAND = "Sikh World Championships";

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
          <!-- NOT "reply to this email". It said that until 2026-09-02, and the address
               it was sent from does not receive mail — so a parent who replied to a
               safeguarding notice got a bounce saying our server was misconfigured. The
               place to say a mailbox is unattended is in the email, before somebody
               presses reply. -->
          <p style="margin:0;font-size:12px;color:#6b6b66;">
            ${BRAND} — competitions for Sikhs.<br>
            <strong>This address does not receive email</strong> — replies to it will not
            reach us. Questions, or think you got this by mistake? Tell us at
            <a href="https://sikhchampionships.com/support" style="color:#8a6d1f;">sikhchampionships.com/support</a>
            — no account needed, and we read every message.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Escape anything that came from a person before it goes into HTML.
 *
 * These emails carry names, gamertags, regions and notes typed by users. Interpolated
 * raw, a "name" of `<a href="...">Click here</a>` would put an attacker's link inside a
 * safeguarding email sent from our own verified domain to a parent — which is a far better
 * phishing position than they would have on their own. Every user-supplied value in this
 * file goes through here.
 */
export function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** One date format across every email, so they read as coming from the same place. */
function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
       <strong>${esc(n.childDisplayName)}</strong> has asked to use our &ldquo;Find a game&rdquo;
       board, which helps Sikh players find someone to practise against. They need your
       permission first.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       We have your email because it was given when ${esc(n.childDisplayName)} registered for one
       of our events.
     </p>
     <p style="margin:18px 0 8px;font-weight:700;">What you would be agreeing to</p>
     <ul style="margin:0;padding-left:20px;font-size:14px;">
       ${terms.map((t) => `<li style="margin-bottom:7px;">${t}</li>`).join("")}
     </ul>
     ${button(n.approvalUrl, "Say yes or no")}
     <p style="margin:0;font-size:14px;color:#55554f;">
       No account or password needed. If you do nothing, ${esc(n.childDisplayName)} simply does
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
    `${esc(n.childDisplayName)} has arranged a game`,
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
                  <td style="padding:5px 0;font-weight:600;">${esc(v)}</td></tr>`,
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
       <strong>${esc(n.childDisplayName)}</strong> to use our &ldquo;Find a game&rdquo; board.
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
    `<p style="margin:0 0 14px;">Hi ${esc(n.displayName)},</p>
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
  const when = n.eventDate ? longDate(n.eventDate) : "the event date";

  if (n.selected) {
    const subject = `You have a place — ${n.eventTitle}`;
    const text = [
      `${BRAND}`,
      ``,
      `Good news ${n.displayName} — you have a place at ${n.eventTitle} on ${when}.`,
      ``,
      `Your reference is ${n.reference}. Keep it; you will need it at the desk.`,
      ``,
      `ARRIVING. Nothing to print. Your name will be on a card at the desk — you hold it up`,
      `to the camera and you are checked in. If it cannot be found, just give your name.`,
      ``,
      `BRING PROOF OF YOUR DATE OF BIRTH. This is the one thing you must not forget.`,
      `Anything that shows it counts:`,
      `  - a birth certificate`,
      `  - a passport, from any country`,
      `  - an NHS medical card`,
      `  - a school or college card or letter that shows the date of birth`,
      `  - a GP or hospital letter or appointment card showing the date of birth`,
      `  - a UK driving licence, full or provisional`,
      `  - a PASS card such as CitizenCard or Young Scot`,
      `A photo of any of these on a phone is fine, so nothing has to leave the house. We`,
      `look at it, hand it straight back, and record only that we saw a date of birth — no`,
      `photocopy, no photograph, nothing written down from it. Age decides the bracket and`,
      `the supervision rules, so it is the one thing we check rather than take on trust.`,
      ``,
      `Genuinely cannot find anything? Tell us before the day at`,
      `https://sikhchampionships.com/support and we will sort it out then rather than at`,
      `the door.`,
      ``,
      `Your SWC profile keeps your results and trophies across every event you play in.`,
      `Sign in at any time at https://sikhchampionships.com/signin using this email`,
      `address — no password.`,
      ``,
      `We will email again with the venue address and what to bring.`,
      ``,
      `Can't make it any more? Tell us as soon as you can so we can offer your place to`,
      `someone else: https://sikhchampionships.com/support`,
    ].join("\n");

    const html = wrap(
      `You have a place`,
      `<p style="margin:0 0 14px;">
         Good news ${esc(n.displayName)} — you have a place at <strong>${esc(n.eventTitle)}</strong>
         on ${when}.
       </p>
       <p style="margin:0 0 14px;">
         Your reference is <strong style="font-family:monospace;">${esc(n.reference)}</strong>.
         Keep it; you will need it at the desk.
       </p>
       <p style="margin:0 0 14px;">
         <strong>Arriving.</strong> Nothing to print. Your name will be on a card at the
         desk — you hold it up to the camera and you are checked in. If it cannot be found,
         just give your name.
       </p>
       <div style="margin:0 0 14px;padding:12px 14px;background:#fdf6e7;border-radius:8px;">
         <p style="margin:0 0 8px;"><strong>Bring proof of your date of birth.</strong>
           This is the one thing not to forget. Anything that shows it counts:</p>
         <ul style="margin:0 0 8px;padding-left:20px;font-size:14px;color:#55554f;">
           <li>a birth certificate</li>
           <li>a passport, from any country</li>
           <li>an NHS medical card</li>
           <li>a school or college card or letter that shows the date of birth</li>
           <li>a GP or hospital letter or appointment card showing the date of birth</li>
           <li>a UK driving licence, full or provisional</li>
           <li>a PASS card such as CitizenCard or Young Scot</li>
         </ul>
         <p style="margin:0 0 8px;font-size:14px;color:#55554f;">
           <strong>A photo of any of these on a phone is fine</strong>, so nothing has to
           leave the house. We look at it, hand it straight back, and record only that we
           saw a date of birth — no photocopy, no photograph, nothing written down from it.
           Age decides the bracket and the supervision rules, so it is the one thing we
           check rather than take on trust.
         </p>
         <p style="margin:0;font-size:14px;color:#55554f;">
           Genuinely cannot find anything? Tell us before the day at
           sikhchampionships.com/support and we will sort it out then rather than at the door.
         </p>
       </div>
       <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
         Your SWC profile keeps your results and trophies across every event you play in.
         Sign in any time with this email address — no password.
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
    `<p style="margin:0 0 14px;">Hi ${esc(n.displayName)},</p>
     <p style="margin:0 0 14px;">
       We had more applications than places for <strong>${esc(n.eventTitle)}</strong>, so places
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

/**
 * Acknowledging that we received someone's interest in an event.
 *
 * Sent the moment the form is submitted. Until round 42 nothing was sent at all: a person
 * filled in twenty fields including their child's medical details and got a screen, then
 * silence, with no way to tell whether it arrived. For a parent that reads as a scam.
 *
 * It must be honest about what has and has not happened. Registering interest is NOT a
 * place — places are drawn — and this email is the last chance to say so before someone
 * tells their child they are going.
 */
export function interestReceived(n: {
  displayName: string;
  eventTitle: string;
  eventDate: string | null;
  reference: string;
  /** When the draw happens, i.e. when applications close. Null if not yet fixed. */
  drawAfter: string | null;
}): Rendered {
  const when = n.eventDate ? longDate(n.eventDate) : "the event date";
  const draw = n.drawAfter
    ? `after applications close on ${longDate(n.drawAfter)}`
    : "once applications close";

  const subject = `We have your interest — ${n.eventTitle}`;
  const text = [
    `${BRAND}`,
    ``,
    `Thanks ${n.displayName} — we have your interest in ${n.eventTitle} on ${when}.`,
    ``,
    `THIS IS NOT A PLACE YET. There are more people who want to play than there are`,
    `places, so places are decided by a random draw ${draw}. We will email you either`,
    `way, so you do not need to check or chase.`,
    ``,
    `Your reference is ${n.reference}.`,
    ``,
    `We have created your ${BRAND} profile with this email address. You keep it for every`,
    `future event — sign in any time at https://sikhchampionships.com/signin. There is no`,
    `password; we email you a link.`,
    ``,
    `BRING PROOF OF YOUR DATE OF BIRTH IF YOU GET A PLACE. Anything that shows it — a`,
    `birth certificate, a passport, an NHS card, or a school or college letter or card`,
    `carrying the date of birth. A PHOTO OF IT ON A PHONE IS FINE, so nothing has to leave`,
    `the house. It is checked at the door, handed straight back, and we write down nothing`,
    `from it. Age decides the bracket and the supervision rules, so it is the one thing we`,
    `check rather than take on trust.`,
    ``,
    `WHAT YOU AGREED TO BY REGISTERING: photos and video are taken at the event and may`,
    `be used on our website, our social media, and in material promoting future events.`,
    `Not sold, and not used in sponsors' own advertising. If you would rather not be`,
    `filmed, tell us at https://sikhchampionships.com/support and our photographers are`,
    `told. It has no effect on your place.`,
    ``,
    `Need to change or withdraw anything? https://sikhchampionships.com/support`,
  ].join("\n");

  const html = wrap(
    `We have your interest`,
    `<p style="margin:0 0 14px;">
       Thanks ${esc(n.displayName)} — we have your interest in
       <strong>${esc(n.eventTitle)}</strong> on ${when}.
     </p>
     <p style="margin:0 0 14px;padding:12px 14px;background:#fdf6e7;border-radius:8px;font-size:14px;">
       <strong>This is not a place yet.</strong> More people want to play than there are
       places, so places are decided by a random draw ${draw}. We will email you either
       way — you do not need to check or chase.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       Your reference is
       <strong style="font-family:monospace;">${esc(n.reference)}</strong>.
     </p>
     <p style="margin:0 0 4px;font-size:14px;color:#55554f;">
       We have created your ${BRAND} profile with this email address. You keep it for every
       future event — no password, we email you a link.
     </p>
     ${button("https://sikhchampionships.com/signin", "Sign in to your profile")}
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       <strong>If you get a place, bring proof of your date of birth.</strong> Anything
       that shows it — a birth certificate, a passport, an NHS card, or a school or college
       letter or card that carries it. <strong>A photo of it on a phone is fine</strong>, so
       nothing has to leave the house. It is checked at the door, handed straight back, and
       we write down nothing from it. Age decides the bracket and the supervision rules, so
       it is the one thing we check rather than take on trust.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       <strong>What you agreed to by registering:</strong> photos and video are taken at
       the event and may be used on our website, our social media and in material
       promoting future events — not sold, and not used in sponsors&rsquo; own
       advertising. If you would rather not be filmed, just tell us and our photographers
       are told. It has no effect on your place.
     </p>
     <p style="margin:0;font-size:14px;color:#55554f;">
       Need to change or withdraw anything? Get in touch and we will sort it.
     </p>`,
  );
  return { subject, text, html };
}

/**
 * Telling a parent or guardian that their child has registered interest.
 *
 * Sent at the same time as the acknowledgement above, to the guardian address on the
 * form. This is the only check that a real adult knows: everything else on the form was
 * typed by whoever filled it in, and a child can type a parent's name and tick a box
 * saying the parent agreed. This email is what makes that claim visible to the person it
 * was made about, while there is still time to say no.
 *
 * It therefore states plainly what was agreed on their behalf, and what to do if it was
 * not them.
 */
export function guardianInterestNotice(n: {
  childDisplayName: string;
  eventTitle: string;
  eventDate: string | null;
  venue: string | null;
  /** What supervision this age tier requires — from guardian-rules. */
  supervision: string;
  reference: string;
}): Rendered {
  const when = n.eventDate ? longDate(n.eventDate) : "a date still to be confirmed";

  const subject = `${n.childDisplayName} has registered for ${n.eventTitle}`;
  const text = [
    `${BRAND}`,
    ``,
    `${n.childDisplayName} has registered interest in ${n.eventTitle}, a free gaming`,
    `tournament for Sikh young people, on ${when}${n.venue ? ` in ${n.venue}` : ""}.`,
    ``,
    `Your email was given as their parent or guardian, and the form recorded that you`,
    `agreed to them taking part.`,
    ``,
    `WHAT THIS MEANS FOR YOU: ${n.supervision}`,
    ``,
    `This is not a place yet — places are decided by a random draw, and we will email`,
    `again either way.`,
    ``,
    `Reference ${n.reference}.`,
    ``,
    `IF THEY GET A PLACE, THEY MUST BRING PROOF OF THEIR DATE OF BIRTH. This is asked of`,
    `every player. Anything showing it counts - a birth certificate, a passport, an NHS`,
    `card, or a school or college letter or card carrying the date of birth - and A PHOTO`,
    `OF IT ON A PHONE IS FINE, so the document does not have to leave your house. It is`,
    `looked at, handed straight back, and nothing from it is written down: we record only`,
    `that we saw a date of birth. We ask because age decides both the bracket and the`,
    `supervision above, and until now that has rested on a date typed into a form.`,
    ``,
    `If you cannot find anything at all, tell us before the day at`,
    `https://sikhchampionships.com/support rather than at the door.`,
    ``,
    `ONE MORE THING THE REGISTRATION COVERS, so you know before the day. Photos and`,
    `video are taken at the event, and may be used on our website, our social media, and`,
    `in material promoting future events. They are not sold and not used in sponsors'`,
    `own advertising. If you would rather they were not filmed, tell us and our`,
    `photographers are told - it has no effect on their place.`,
    ``,
    `IF THIS WAS NOT AGREED WITH YOU, or you do not want them to take part, tell us at`,
    `https://sikhchampionships.com/support and we will remove the registration. You do not`,
    `need an account and you do not have to give a reason.`,
  ].join("\n");

  const html = wrap(
    `${esc(n.childDisplayName)} has registered for ${esc(n.eventTitle)}`,
    `<p style="margin:0 0 14px;">
       <strong>${esc(n.childDisplayName)}</strong> has registered interest in
       <strong>${esc(n.eventTitle)}</strong>, a free gaming tournament for Sikh young
       people, on ${when}${n.venue ? ` in ${esc(n.venue)}` : ""}.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       Your email was given as their parent or guardian, and the form recorded that you
       agreed to them taking part.
     </p>
     <p style="margin:0 0 14px;padding:12px 14px;background:#fdf6e7;border-radius:8px;font-size:14px;">
       <strong>What this means for you:</strong> ${esc(n.supervision)}
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       This is not a place yet — places are decided by a random draw, and we will email
       again either way. Reference
       <strong style="font-family:monospace;">${esc(n.reference)}</strong>.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       <strong>If they get a place, they must bring proof of their date of birth.</strong>
       This is asked of every player. Anything showing it counts — a birth certificate, a
       passport, an NHS card, or a school or college letter or card carrying the date of
       birth — and <strong>a photo of it on a phone is fine</strong>, so the document does
       not have to leave your house. It is looked at, handed straight back, and nothing
       from it is written down: we record only that we saw a date of birth. We ask because
       age decides both the bracket and the supervision above, and until now that has
       rested on a date typed into a form. If you cannot find anything at all, tell us
       before the day rather than at the door.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       <strong>One more thing the registration covers, so you know before the day.</strong>
       Photos and video are taken at the event and may be used on our website, our social
       media and in material promoting future events — not sold, and not used in
       sponsors&rsquo; own advertising. If you would rather they were not filmed, tell us
       and our photographers are told. It has no effect on their place.
     </p>
     ${button("https://sikhchampionships.com/support", "This was not agreed with me")}
     <p style="margin:0;font-size:14px;color:#55554f;">
       If you do not want them to take part, tell us and we will remove the registration.
       No account needed, and no reason required.
     </p>`,
  );
  return { subject, text, html };
}

/* ---------- The week before ---------- */

/**
 * What to bring, said the same way in three places.
 *
 * Read from `src/data/id-check.ts` rather than retyped, because a requirement stated
 * five slightly different ways is a requirement nobody can enforce — the comment at the
 * top of that file, and the reason it exists.
 */
function bringLines(): string[] {
  return [ID_REQUIREMENT, ID_PHOTO_ALLOWED, ID_WE_KEEP_NOTHING];
}

/** The supervision sentence for one player, or null for an adult. */
function supervisionLine(n: {
  under16: boolean;
  under18: boolean;
  mayLeaveUnaccompanied: boolean;
}): string | null {
  if (n.under16) {
    return "A parent or guardian has to stay at the venue all day. Not sitting with you — there is seating, langar and the bracket on the big screen — but in the building.";
  }
  if (!n.under18) return null;
  return n.mayLeaveUnaccompanied
    ? "Your guardian agreed you may leave on your own at the end of the day."
    : "An adult has to collect you at the end of the day — your guardian did not agree to you leaving on your own.";
}

/**
 * The reminder, sent in the week before the event to everybody who has a place.
 *
 * PROMISED IN THE OFFER EMAIL. "We will email again with the venue address and what to
 * bring" has been in `applicationOutcome` since it was written, and until now nothing
 * sent it — a promise made to a child and their parent by a system that could not keep it.
 *
 * IT IS THE ONLY EMAIL THAT CARRIES THE STREET ADDRESS. Everywhere else says the town
 * (`venueLocality`), because an address in an email sent to whatever address was typed
 * into a form is a different thing from an address sent to somebody who has a place.
 */
export function eventReminder(n: {
  displayName: string;
  eventTitle: string;
  eventDate: string | null;
  times: string | null;
  venueName: string | null;
  venueAddress: string | null;
  mapsUrl: string | null;
  reference: string;
  under16: boolean;
  under18: boolean;
  mayLeaveUnaccompanied: boolean;
}): Rendered {
  const when = n.eventDate ? longDate(n.eventDate) : "the event date";
  const hours = n.times ? `We run ${n.times}.` : "";
  const supervision = supervisionLine(n);

  // `null` is an absent optional line and is dropped; "" is a deliberate blank and is
  // kept. Filtering on `!== ""` collapsed every paragraph break in the plain-text version
  // into one wall of prose, which is the half of the email some parents actually read.
  const subject = `${n.eventTitle} — ${when}, and what to bring`;
  const text = ([
    `${BRAND}`,
    ``,
    `${n.displayName} — you are playing at ${n.eventTitle} on ${when}. ${hours}`,
    ``,
    `WHERE`,
    n.venueName,
    n.venueAddress,
    n.mapsUrl ? `Map: ${n.mapsUrl}` : null,
    ``,
    `BRING`,
    ...bringLines().map((l) => `  - ${l}`),
    `  - Your own PS5 controller if you would rather use one. Consoles, screens and pads`,
    `    are all provided, so you do not have to.`,
    ``,
    `Nothing else. Entry is free and langar is on all day.`,
    ``,
    `AT THE DOOR. Your name is on a card at the desk — you hold it up to the camera and`,
    `you are checked in. If it cannot be found, just give your name. Your reference is`,
    `${n.reference}.`,
    ``,
    ...(supervision ? [`GETTING HOME`, supervision, ``] : []),
    `PHOTOS. Photographs and video are taken at the event and may be used on our website,`,
    `our social media and in material promoting future events — not sold, and not used in`,
    `sponsors' own advertising. If you would rather not be photographed, tell us before`,
    `the day at https://sikhchampionships.com/support and the photographers are told. It`,
    `has no effect on your place.`,
    ``,
    `CANNOT COME ANY MORE? Tell us as soon as you can and we can offer the place to`,
    `somebody else: https://sikhchampionships.com/support`,
  ] as (string | null)[])
    .filter((l): l is string => l !== null)
    .join("\n");

  const html = wrap(
    `Everything you need for Saturday`,
    `<p style="margin:0 0 14px;">
       ${esc(n.displayName)} — you are playing at <strong>${esc(n.eventTitle)}</strong> on
       ${when}. ${esc(hours)}
     </p>
     <div style="margin:0 0 14px;padding:12px 14px;background:#fdf6e7;border-radius:8px;">
       <p style="margin:0 0 4px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#8a6d1f;">Where</p>
       <p style="margin:0;font-size:15px;">
         ${n.venueName ? `<strong>${esc(n.venueName)}</strong><br>` : ""}
         ${n.venueAddress ? esc(n.venueAddress) : "Address to follow"}
       </p>
       ${
         n.mapsUrl
           ? `<p style="margin:8px 0 0;font-size:14px;"><a href="${esc(n.mapsUrl)}" style="color:#8a6d1f;">Open in maps</a></p>`
           : ""
       }
     </div>
     <p style="margin:0 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#8a6d1f;">Bring</p>
     <ul style="margin:0 0 14px;padding-left:20px;font-size:14px;color:#55554f;">
       ${bringLines().map((l) => `<li>${esc(l)}</li>`).join("")}
       <li>Your own PS5 controller if you would rather use one — consoles, screens and
           pads are provided, so you do not have to.</li>
     </ul>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       Nothing else. Entry is free and langar is on all day.
     </p>
     <p style="margin:0 0 14px;">
       <strong>At the door.</strong> Your name is on a card at the desk — hold it up to the
       camera and you are checked in. If it cannot be found, just give your name. Your
       reference is <strong style="font-family:monospace;">${esc(n.reference)}</strong>.
     </p>
     ${
       supervision
         ? `<p style="margin:0 0 14px;padding:12px 14px;background:#f4f4f1;border-radius:8px;font-size:14px;">
              <strong>Getting home.</strong> ${esc(supervision)}
            </p>`
         : ""
     }
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       <strong>Photos.</strong> Photographs and video are taken at the event and may be
       used on our website, our social media and in material promoting future events — not
       sold, and not used in sponsors&rsquo; own advertising. If you would rather not be
       photographed, tell us before the day and the photographers are told. It has no
       effect on your place.
     </p>
     <p style="margin:0;font-size:14px;color:#55554f;">
       Cannot come any more? Tell us as soon as you can so the place can go to somebody
       else.
     </p>`,
  );
  return { subject, text, html };
}

/**
 * The same reminder, to the guardian of an under-18.
 *
 * A SEPARATE EMAIL RATHER THAN A CC, for the reason invariant 4 exists: the guardian
 * address came from the registration record and the child's did not, and the two people
 * need different sentences. A twelve-year-old does not need to be told they must be
 * collected — the person collecting them does.
 */
export function guardianEventReminder(n: {
  childName: string;
  eventTitle: string;
  eventDate: string | null;
  times: string | null;
  venueName: string | null;
  venueAddress: string | null;
  mapsUrl: string | null;
  under16: boolean;
  mayLeaveUnaccompanied: boolean;
}): Rendered {
  const when = n.eventDate ? longDate(n.eventDate) : "the event date";
  const hours = n.times ? `The day runs ${n.times}.` : "";
  const supervision = n.under16
    ? "You (or another adult responsible for them) need to stay at the venue for the whole event. There is seating, langar and the bracket on the big screen — you do not have to sit with them, but we need you in the building."
    : n.mayLeaveUnaccompanied
      ? "You agreed they may leave on their own at the end of the day. If that has changed, tell us and we will hold them at the desk until you arrive."
      : "They must be collected by an adult at the end of the day. Nobody under 18 leaves with anyone else unless you have told us.";

  const subject = `${n.childName} is playing on ${when} — where and when`;
  const text = ([
    `${BRAND}`,
    ``,
    `${n.childName} has a place at ${n.eventTitle} on ${when}. ${hours}`,
    ``,
    `WHERE`,
    n.venueName,
    n.venueAddress,
    n.mapsUrl ? `Map: ${n.mapsUrl}` : null,
    ``,
    `WHAT YOU NEED TO KNOW`,
    supervision,
    ``,
    `PROOF OF DATE OF BIRTH IS CHECKED AT THE DOOR, for every player.`,
    ...bringLines().map((l) => `  - ${l}`),
    ``,
    `Entry is free, langar is on all day, and consoles and controllers are provided.`,
    ``,
    `PHOTOS. Photographs and video are taken and may be used on our website, our social`,
    `media and in material promoting future events — not sold, and not used in sponsors'`,
    `own advertising. If you would rather ${n.childName} was not photographed, tell us`,
    `before the day at https://sikhchampionships.com/support and the photographers are`,
    `told. It has no effect on their place.`,
    ``,
    `Anything at all, including if they can no longer come:`,
    `https://sikhchampionships.com/support`,
  ] as (string | null)[])
    .filter((l): l is string => l !== null)
    .join("\n");

  const html = wrap(
    `${esc(n.childName)} is playing on Saturday`,
    `<p style="margin:0 0 14px;">
       ${esc(n.childName)} has a place at <strong>${esc(n.eventTitle)}</strong> on ${when}.
       ${esc(hours)}
     </p>
     <div style="margin:0 0 14px;padding:12px 14px;background:#fdf6e7;border-radius:8px;">
       <p style="margin:0 0 4px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#8a6d1f;">Where</p>
       <p style="margin:0;font-size:15px;">
         ${n.venueName ? `<strong>${esc(n.venueName)}</strong><br>` : ""}
         ${n.venueAddress ? esc(n.venueAddress) : "Address to follow"}
       </p>
       ${
         n.mapsUrl
           ? `<p style="margin:8px 0 0;font-size:14px;"><a href="${esc(n.mapsUrl)}" style="color:#8a6d1f;">Open in maps</a></p>`
           : ""
       }
     </div>
     <p style="margin:0 0 14px;padding:12px 14px;background:#f4f4f1;border-radius:8px;">
       <strong>What you need to know.</strong> ${esc(supervision)}
     </p>
     <p style="margin:0 0 6px;font-size:14px;">
       <strong>Proof of date of birth is checked at the door</strong>, for every player.
     </p>
     <ul style="margin:0 0 14px;padding-left:20px;font-size:14px;color:#55554f;">
       ${bringLines().map((l) => `<li>${esc(l)}</li>`).join("")}
     </ul>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       Entry is free, langar is on all day, and consoles and controllers are provided.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       <strong>Photos.</strong> Photographs and video are taken and may be used on our
       website, our social media and in material promoting future events — not sold, and
       not used in sponsors&rsquo; own advertising. If you would rather
       ${esc(n.childName)} was not photographed, tell us before the day and the
       photographers are told. It has no effect on their place.
     </p>
     <p style="margin:0;font-size:14px;color:#55554f;">
       Anything at all, including if they can no longer come — get in touch.
     </p>`,
  );
  return { subject, text, html };
}

/* ---------- Volunteers ---------- */

/**
 * Acknowledging somebody who offered to help.
 *
 * Short on purpose, and honest about the two things that will otherwise be a surprise: a
 * person reads this before anything happens, and every role near the players needs a
 * check. Told now, in the email they expect, rather than in a phone call a fortnight
 * later that sounds like being turned down.
 */
export function volunteerReceived(n: {
  fullName: string;
  eventTitle: string;
  eventDate: string | null;
  reference: string;
  roles: string[];
  dbsAsked: boolean;
}): Rendered {
  const when = n.eventDate ? longDate(n.eventDate) : "the event";
  const roles = n.roles.length > 0 ? n.roles.join(", ") : "wherever you are needed";

  const subject = `Thanks for offering to help — ${n.eventTitle}`;
  const text = [
    `${BRAND}`,
    ``,
    `Thanks ${n.fullName}. We have your offer to help at ${n.eventTitle} on ${when}.`,
    ``,
    `You put yourself down for: ${roles}.`,
    `Your reference is ${n.reference}.`,
    ``,
    `WHAT HAPPENS NOW. Somebody will be in touch to confirm which job and what time to`,
    `arrive. We will speak to the person you named before the day — that is standard for`,
    `anyone working at an event for under-18s, and it is not a comment on you.`,
    ...(n.dbsAsked
      ? [
          ``,
          `ABOUT THE DBS. You said you do not have a current check, or were not sure. That`,
          `does not rule you out: most jobs on the day are alongside somebody who does hold`,
          `one. We will tell you which roles that leaves open.`,
        ]
      : []),
    ``,
    `Changed your mind, or got a detail wrong? https://sikhchampionships.com/support`,
  ].join("\n");

  const html = wrap(
    `Thanks for offering to help`,
    `<p style="margin:0 0 14px;">
       Thanks ${esc(n.fullName)}. We have your offer to help at
       <strong>${esc(n.eventTitle)}</strong> on ${when}.
     </p>
     <p style="margin:0 0 14px;font-size:14px;color:#55554f;">
       You put yourself down for: <strong>${esc(roles)}</strong>.<br>
       Your reference is <strong style="font-family:monospace;">${esc(n.reference)}</strong>.
     </p>
     <p style="margin:0 0 14px;">
       <strong>What happens now.</strong> Somebody will be in touch to confirm which job
       and what time to arrive. We will speak to the person you named before the day —
       that is standard for anyone working at an event for under-18s, and it is not a
       comment on you.
     </p>
     ${
       n.dbsAsked
         ? `<p style="margin:0 0 14px;padding:12px 14px;background:#fdf6e7;border-radius:8px;font-size:14px;">
              <strong>About the DBS.</strong> You said you do not have a current check, or
              were not sure. That does not rule you out: most jobs on the day are alongside
              somebody who does hold one, and we will tell you which roles that leaves open.
            </p>`
         : ""
     }
     <p style="margin:0;font-size:14px;color:#55554f;">
       Changed your mind, or got a detail wrong? Just tell us.
     </p>`,
  );
  return { subject, text, html };
}
