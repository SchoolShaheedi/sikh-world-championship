import type { Metadata } from "next";
import Link from "next/link";
import { findByToken, isExpired } from "@/lib/guardian-store";
import { GUARDIAN_TERMS } from "@/lib/guardian-types";
import { decide } from "./actions";
import { copy, fill } from "@/copy";
import { Rich } from "@/copy/Rich";

export const metadata: Metadata = {
  title: copy.guardian.metaTitle,
  // A permission link must never be indexed or previewed by a link scanner.
  robots: { index: false, follow: false },
};

export default async function GuardianPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const approval = await findByToken(token);

  if (!approval) {
    return (
      <Shell title={copy.guardian.invalidTitle}>
        <p className="text-muted">
          <Rich
            text={copy.guardian.invalidBody}
            em={(s, i) => (
              <Link key={i} href="/support" className="text-kesri hover:underline">
                {s}
              </Link>
            )}
          />
        </p>
      </Shell>
    );
  }

  if (isExpired(approval)) {
    return (
      <Shell title={copy.guardian.expiredTitle}>
        <p className="text-muted">
          {fill(copy.guardian.expiredBody, {
            childName: approval.childDisplayName,
          })}
        </p>
      </Shell>
    );
  }

  const isApproved = approval.status === "approved";

  return (
    <Shell
      title={
        isApproved
          ? fill(copy.guardian.titleApproved, {
              childName: approval.childDisplayName,
            })
          : approval.status === "declined" || approval.status === "revoked"
            ? fill(copy.guardian.titleDeclined, {
                childName: approval.childDisplayName,
              })
            : fill(copy.guardian.titlePending, {
                childName: approval.childDisplayName,
              })
      }
    >
      {approval.status === "pending" && (
        <p className="text-muted">
          {fill(copy.guardian.pendingBody, {
            childName: approval.childDisplayName,
          })}
        </p>
      )}

      {isApproved && (
        <p className="rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm text-body">
          {fill(copy.guardian.approvedBody, {
            date: new Date(approval.respondedAt!).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
          })}
        </p>
      )}

      {(approval.status === "declined" || approval.status === "revoked") && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-body">
          {fill(copy.guardian.declinedBody, {
            childName: approval.childDisplayName,
          })}
        </p>
      )}

      {/* The terms. Shown in full whatever the current status — a guardian revisiting
          this page should be able to re-read exactly what they agreed to. */}
      <div className="mt-8 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-lg text-kesri">
          {copy.guardian.termsTitle}
        </h2>
        <ul className="mt-4 space-y-3">
          {GUARDIAN_TERMS.map((t) => (
            <li key={t} className="flex gap-3 text-sm text-muted">
              <span className="text-kesri">—</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {!isApproved && (
          <form action={decide}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="decision" value="approved" />
            <button className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink hover:bg-kesrisoft">
              {fill(copy.guardian.allowCta, {
                childName: approval.childDisplayName,
              })}
            </button>
          </form>
        )}

        {approval.status === "pending" && (
          <form action={decide}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="decision" value="declined" />
            <button className="rounded-xl border border-line px-6 py-3 font-semibold text-body">
              {copy.guardian.declineCta}
            </button>
          </form>
        )}

        {isApproved && (
          <form action={decide}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="decision" value="revoked" />
            <button className="rounded-xl border border-kesri/50 bg-kesri/10 px-6 py-3 font-semibold text-kesri">
              {copy.guardian.revokeCta}
            </button>
          </form>
        )}
      </div>

      {/* History, so a guardian can see every change that's been made. */}
      {approval.history.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-bold tracking-[0.16em] text-muted uppercase">
            {copy.guardian.historyTitle}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {approval.history.map((h, i) => (
              <li key={i} className="text-sm text-muted">
                {new Date(h.at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                — {copy.guardian.historyChanged}{" "}
                <span className="text-body">{h.from}</span>{" "}
                {copy.guardian.historyTo}{" "}
                <span className="text-body">{h.to}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-10 rounded-2xl border border-line bg-surface/50 p-5 text-sm text-muted">
        <Rich
          text={copy.guardian.footnote}
          em={(s, i) => (
            <Link key={i} href="/support" className="text-kesri hover:underline">
              {s}
            </Link>
          )}
        />
      </p>
    </Shell>
  );
}

function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
      <div className="mt-5">{children}</div>
    </div>
  );
}
