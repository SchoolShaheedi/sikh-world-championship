/**
 * The jobs on 3 October that the app cannot do.
 *
 * WHY THIS IS DATA AND NOT A DOCUMENT: it is shown at the top of /admin, above the draw,
 * because every item here is a thing a person has to do and the failure mode is nobody
 * remembering on the morning. A checklist in a Google Doc is a checklist nobody opens.
 *
 * The rule for adding to this list: it belongs here only if the app CANNOT enforce it. If
 * something on this list could be built, build it and take it off — a checklist is the
 * weakest control there is, and it is here because these five have no stronger one.
 */
export interface OnTheDayItem {
  title: string;
  detail: string;
  /** What the app can offer the person doing it, or null if nothing. */
  appHelps: string | null;
}

export const ON_THE_DAY: OnTheDayItem[] = [
  {
    title: "Print and cut the check-in slips, and try the camera, the night before",
    detail:
      "Sixty-four slips, 18 to a sheet, cut along the lines and kept in name order. Hand each one over rather than laying the pile out for people to help themselves — the date of birth is checked at the same moment, so the two jobs are one conversation. Then open Arrivals on the actual laptop that will be on the desk and scan one, because the browser asks for camera permission the first time and a refused prompt is a locked camera. Do both the night before: a printer with no toner at nine in the morning is a queue of parents.",
    appHelps: "Arrivals → Open the print sheet",
  },
  {
    title: "Brief the desk on what counts as proof of date of birth",
    detail:
      "Every player must bring something showing their date of birth (decided 2026-09-03), and the reason is age rather than identity — one bracket runs 12 to 25 and every supervision rule hangs off a date somebody typed into a form. Read the accepted list to whoever is on the desk before the doors open, including that a photo on a phone counts. Two things they must not have to work out on the spot: nobody is turned away by a volunteer, and the safeguarding lead — not the person on the door — decides about anyone who arrives with nothing. It matters most for anyone near the 12 or 25 line and for a 16–17-year-old due to leave on their own. The document is looked at and handed straight back; nothing is copied, photographed or written down.",
    appHelps: "Arrivals → “What counts as proof of date of birth”, and a “No date of birth” filter",
  },
  {
    title: "Nobody under 16 leaves without the adult who brought them",
    detail:
      "12–15s have a parent at the venue all day. 16–17s leave alone only if their guardian ticked it at registration. Somebody has to be on the door at the end with that list — the app records the permission, it cannot stop a child walking out.",
    appHelps: "Arrivals shows it against every name, and on the desk list at the end of the day",
  },
  {
    title: "Brief the photographers",
    detail:
      "Photography is a condition of entering, so almost everyone is fair game. The exception is anyone who objected: that arrives as a message rather than a field, so the list has to be carried by hand. No photography in toilets, changing areas or prayer spaces.",
    appHelps: null,
  },
  {
    title: "Read the public names before the doors open",
    detail:
      "Smaller than it used to be. Since the handle box was removed on 2026-09-02 nobody types the string that goes on the screen — it is built from the name on the registration, so it is first name plus last initial and nothing else. What is left is the name itself: a child can still have typed something into the name field that should not be on a projector or on a slip laid out on a table. 64 rows, once, by a human being.",
    appHelps: "Names on the screen, with an inline correction",
  },
  {
    title: "The first aider has the medical notes",
    detail:
      "Print or open them before the first match, not when something happens. They are deleted 30 days after the event, so this is the only window.",
    appHelps: "Entries holds what each player declared",
  },
  {
    title: "Delete any test entries",
    detail:
      "A rehearsal entry is a real row with a made-up name. At the check-in desk it is indistinguishable from a real one, and it will appear in the draw.",
    appHelps: "Entries → Show all → Delete",
  },
];
