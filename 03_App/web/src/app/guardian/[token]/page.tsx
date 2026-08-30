import type { Metadata } from "next";
import Link from "next/link";
import { findByToken, isExpired } from "@/lib/guardian-store";
import { GUARDIAN_TERMS } from "@/lib/guardian-types";
import { decide } from "./actions";

export const metadata: Metadata = {
  title: "Permission for your child",
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
      <Shell title="This link isn't valid">
        <p className="text-muted">
          It may have been mistyped, or replaced by a newer request. Ask your child to
          request permission again, or{" "}
          <Link href="/support" className="text-kesri hover:underline">
            get in touch
          </Link>{" "}
          and we&apos;ll sort it out.
        </p>
      </Shell>
    );
  }

  if (isExpired(approval)) {
    return (
      <Shell title="This request has expired">
        <p className="text-muted">
          Permission requests stay open for 30 days. Ask {approval.childDisplayName} to
          request it again and you&apos;ll get a fresh link.
        </p>
      </Shell>
    );
  }

  const isApproved = approval.status === "approved";

  return (
    <Shell
      title={
        isApproved
          ? `${approval.childDisplayName} has permission`
          : approval.status === "declined" || approval.status === "revoked"
            ? `${approval.childDisplayName} does not have access`
            : `Permission for ${approval.childDisplayName}`
      }
    >
      {approval.status === "pending" && (
        <p className="text-muted">
          {approval.childDisplayName} would like to use the Sikh World Championship
          &ldquo;Find a game&rdquo; board, where young Sikh players arrange games with each
          other. Because they&apos;re under 16, we need your permission first.
        </p>
      )}

      {isApproved && (
        <p className="rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm text-body">
          You gave permission on{" "}
          {new Date(approval.respondedAt!).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          . You can withdraw it below at any time — access stops immediately.
        </p>
      )}

      {(approval.status === "declined" || approval.status === "revoked") && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-body">
          {approval.childDisplayName} can&apos;t use the board. You can allow it below if
          you change your mind.
        </p>
      )}

      {/* The terms. Shown in full whatever the current status — a guardian revisiting
          this page should be able to re-read exactly what they agreed to. */}
      <div className="mt-8 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-lg text-kesri">
          What you&apos;re agreeing to
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
              Yes, allow {approval.childDisplayName}
            </button>
          </form>
        )}

        {approval.status === "pending" && (
          <form action={decide}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="decision" value="declined" />
            <button className="rounded-xl border border-line px-6 py-3 font-semibold text-body">
              No, not for now
            </button>
          </form>
        )}

        {isApproved && (
          <form action={decide}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="decision" value="revoked" />
            <button className="rounded-xl border border-kesri/50 bg-kesri/10 px-6 py-3 font-semibold text-kesri">
              Withdraw permission
            </button>
          </form>
        )}
      </div>

      {/* History, so a guardian can see every change that's been made. */}
      {approval.history.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-bold tracking-[0.16em] text-muted uppercase">
            History
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
                — changed from <span className="text-body">{h.from}</span> to{" "}
                <span className="text-body">{h.to}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-10 rounded-2xl border border-line bg-surface/50 p-5 text-sm text-muted">
        Questions, or something doesn&apos;t look right?{" "}
        <Link href="/support" className="text-kesri hover:underline">
          Tell us
        </Link>
        . If you didn&apos;t expect this email, say so — it matters.
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
