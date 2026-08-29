import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/session";
import { SignInForm } from "@/components/SignInForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  expired: "That link had expired — they only last 15 minutes. Here's a fresh one.",
  used: "That link had already been used. Ask for a new one.",
  invalid: "That link wasn't valid. Ask for a new one.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // Already signed in — no reason to show the form.
  if (await currentPlayer()) redirect("/profile");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Sign in</h1>
      {error && REASONS[error] && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-kesri/40 bg-kesri/[0.08] p-4 text-sm text-kesrisoft"
        >
          {REASONS[error]}
        </p>
      )}
      <p className="mt-4 text-muted">
        No password. Put in the email address you used when you entered an event, and
        we&apos;ll send you a link.
      </p>
      <div className="mt-8">
        <SignInForm />
      </div>
      <p className="mt-8 text-sm text-muted">
        Haven&apos;t entered an event yet? You get an account automatically when you do —
        there&apos;s no separate sign-up to do first.
      </p>
    </div>
  );
}
