/**
 * Proof of date of birth at the door.
 *
 * DECIDED 2026-09-03 by the team: every player must bring identification showing their
 * date of birth to collect their slip.
 *
 * WHAT IT IS ACTUALLY FOR. Not identity — a volunteer who has never met a thirteen-year-old
 * cannot verify one from a document, and the twelve-to-fifteens have a parent with them all
 * day anyway. It is AGE. One open bracket runs 12 to 25, and the supervision tier a child
 * falls into is decided entirely by the date of birth typed into a form by whoever was at
 * the keyboard. A wrong year is not a clerical error: it puts a twenty-seven-year-old in a
 * children's bracket, or lets a fifteen-year-old leave alone on a permission written for a
 * sixteen-year-old.
 *
 * THE PROBLEM WITH IT, STATED HERE RATHER THAN DISCOVERED AT THE DOOR. Most twelve- to
 * fifteen-year-olds in this country hold nothing with a date of birth on it. No licence,
 * no PASS card unless somebody bought one, and school cards carry a name and a photo but
 * almost never a date of birth. For that age group "any ID with a DOB" means a passport or
 * a birth certificate — documents that live in a drawer and that no parent wants a child
 * carrying across Leicester. Two things are done about that, and both are in the list
 * below rather than left to a volunteer's judgement:
 *
 *   1. THE LIST IS BROAD AND WRITTEN DOWN. "Any ID" said vaguely becomes an argument about
 *      a library card with a queue behind it. Everything we will accept is enumerated, so
 *      the answer at the door is reading, not deciding.
 *   2. A PHOTO ON A PHONE COUNTS. This is the line that makes the requirement survivable:
 *      a parent photographs the passport page at home and the document never leaves the
 *      house. Say it everywhere the requirement is stated.
 *
 * WHAT IS RECORDED. That somebody's date of birth was seen, when, and by which moderator.
 * **Never the document, its number, its type, or an image of it, and never a copy of
 * anything.** There is deliberately no column for any of that — see
 * migrations/0013_dob_verified.sql. The document is looked at and handed straight back.
 *
 * ONE SOURCE OF TRUTH. The form, the event page, the confirmation email, the guardian
 * email, the selection email and the arrival desk all read this file. A requirement stated
 * five slightly different ways is a requirement nobody can enforce.
 */

/** The single sentence, for anywhere that has room for one line. */
export const ID_REQUIREMENT =
  "Everyone playing must bring something showing their date of birth, to check in at the door.";

/** The sentence that makes it achievable. Never state the requirement without it. */
export const ID_PHOTO_ALLOWED =
  "A photo of it on a phone is fine — the document itself does not have to leave the house.";

/** What we do with it, which is nothing. */
export const ID_WE_KEEP_NOTHING =
  "We look at it, hand it straight back, and record only that we saw a date of birth. " +
  "No photocopy, no photograph, nothing written down from it.";

/**
 * Everything we accept. Ordered roughly by how likely a twelve-year-old is to have one, so
 * whoever is reading it aloud starts with the useful end.
 */
export const ID_ACCEPTED: string[] = [
  "A birth certificate",
  "A passport, from any country",
  "An NHS medical card",
  "A school or college card or letter that shows the date of birth",
  "A GP or hospital letter or appointment card showing the date of birth",
  "A UK driving licence, full or provisional",
  "A PASS-accredited card such as CitizenCard or Young Scot",
];

/**
 * What happens to the child who arrives without one — and some will.
 *
 * PUT IN CODE ON PURPOSE. The failure this prevents is not a data failure, it is a
 * volunteer improvising a refusal to a thirteen-year-old with a parent standing there. A
 * requirement with no written answer for the exception is a requirement enforced by
 * whoever is most confident at the time.
 *
 * The shape of it: attendance is never held back, because who is in the building is a
 * safeguarding fact and must be right whatever else is unresolved. The row is marked
 * unverified, it shows up in its own filter on the desk, and the SAFEGUARDING LEAD decides
 * — not the person on the door. Where the age actually matters (near the 12 or 25 line, or
 * a 16–17 due to leave alone) that decision has to be made before they play. Where it does
 * not, it does not.
 */
export const ID_NO_DOCUMENT_RULE = [
  "Nobody is turned away at the door by a volunteer.",
  "Check them in as normal — who is in the building has to be right whatever else is unresolved.",
  "Leave them marked “date of birth not checked”; they appear in their own filter on the desk.",
  "The safeguarding lead decides before they play, not the person on the door.",
  "It matters most for anyone near the 12 or 25 line, and for a 16–17-year-old due to leave on their own.",
];
