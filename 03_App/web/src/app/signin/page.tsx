import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/session";
import { SignInForm } from "@/components/SignInForm";
import { copy } from "@/copy";

export const metadata: Metadata = { title: copy.signin.title };
export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  expired: copy.signin.errorExpired,
  used: copy.signin.errorUsed,
  invalid: copy.signin.errorInvalid,
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
      <h1 className="font-display text-3xl">{copy.signin.title}</h1>
      {error && REASONS[error] && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-kesri/40 bg-kesri/[0.08] p-4 text-sm text-kesrisoft"
        >
          {REASONS[error]}
        </p>
      )}
      <p className="mt-4 text-muted">{copy.signin.intro}</p>
      <div className="mt-8">
        <SignInForm />
      </div>
      <p className="mt-8 text-sm text-muted">{copy.signin.footnote}</p>
    </div>
  );
}
