"use client";

import { useState } from "react";
import { revealEntry } from "@/app/admin/entries/actions";
import type { EntryContact } from "@/lib/entry-detail";

/**
 * The masked block, and the button that uncovers it.
 *
 * The masked strings arrive as props; the real ones do not exist on this page until the
 * button is pressed and the server hands them back. That is what makes the masking real
 * rather than cosmetic — see the comment on `revealEntry`.
 *
 * It re-hides on a second press, so a moderator who has finished with a number can put it
 * away rather than leaving it on screen for the rest of the day.
 */
export function EntryReveal({
  reference,
  masked,
  hasMedical,
  medicalPurged,
}: {
  reference: string;
  masked: {
    email: string;
    mobile: string;
    dob: string;
    guardianName: string;
    guardianEmail: string;
    guardianMobile: string;
    emergencyName: string;
    emergencyPhone: string;
  };
  hasMedical: boolean;
  medicalPurged: boolean;
}) {
  const [contact, setContact] = useState<EntryContact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (contact) {
      setContact(null);
      return;
    }
    setBusy(true);
    setError(null);
    const r = await revealEntry(reference);
    if ("error" in r) setError(r.error);
    else setContact(r.contact);
    setBusy(false);
  }

  const rows: [string, string][] = contact
    ? [
        ["Email", contact.email],
        ["Mobile", contact.mobile],
        ["Date of birth", contact.dob],
        ["Guardian", [contact.guardianName, contact.guardianRelation].filter(Boolean).join(" · ") || "—"],
        ["Guardian email", contact.guardianEmail ?? "—"],
        ["Guardian mobile", contact.guardianMobile ?? "—"],
        ["Emergency contact", [contact.emergencyName, contact.emergencyRelation].filter(Boolean).join(" · ") || "—"],
        ["Emergency phone", contact.emergencyPhone ?? "—"],
      ]
    : [
        ["Email", masked.email],
        ["Mobile", masked.mobile],
        ["Date of birth", masked.dob],
        ["Guardian", masked.guardianName],
        ["Guardian email", masked.guardianEmail],
        ["Guardian mobile", masked.guardianMobile],
        ["Emergency contact", masked.emergencyName],
        ["Emergency phone", masked.emergencyPhone],
      ];

  return (
    <section className="mt-8 rounded-2xl border border-line bg-ink/20 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-lg text-kesri">Contact and medical</h2>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className="rounded-xl border border-line px-4 py-2 text-sm text-muted hover:text-body disabled:opacity-50"
        >
          {busy ? "…" : contact ? "Hide again" : "Show contact details"}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Hidden until asked for, so this page can be projected or screen-shared without a
        child&rsquo;s phone number being in the room. Nothing is hidden from you that you
        could not already see.
      </p>
      {error && <p className="mt-3 text-sm text-kesri">{error}</p>}

      <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[9.5rem_1fr] gap-3 sm:col-span-2">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className={`text-sm ${contact ? "text-body" : "text-muted"} break-words`}>
              {v}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 border-t border-linesoft pt-4">
        <h3 className="text-sm text-body">Medical and accessibility</h3>
        {medicalPurged ? (
          <p className="mt-1 text-sm text-muted">
            Deleted by the retention job — medical notes are kept for about 30 days after
            the event and this row is past that. Nothing was retained.
          </p>
        ) : !hasMedical ? (
          <p className="mt-1 text-sm text-muted">Nothing declared.</p>
        ) : !contact ? (
          <p className="mt-1 text-sm text-muted">
            Something is recorded. Press <span className="text-body">Show contact
            details</span> to read it.
          </p>
        ) : (
          <>
            {contact.medicalConditions.filter((c) => c !== "None").length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {contact.medicalConditions
                  .filter((c) => c !== "None")
                  .map((c) => (
                    <li
                      key={c}
                      className="rounded-lg border border-kesri/40 bg-kesri/[0.07] px-2 py-1 text-sm text-body"
                    >
                      {c}
                    </li>
                  ))}
              </ul>
            )}
            {contact.medical && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-body">{contact.medical}</p>
            )}
            {contact.accessibility && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-body">
                <span className="text-muted">Access: </span>
                {contact.accessibility}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
