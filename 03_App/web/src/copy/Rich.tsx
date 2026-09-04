import type { ReactNode } from "react";
import { segments } from ".";

/**
 * Render a copy string, styling whatever it marked with `[[ ]]`.
 *
 * Server and client safe: no hooks, no directive. The default treatment is the one used
 * most on the site — a brighter run of body text inside a muted paragraph — and `em`
 * overrides it where the marked run is a link or a `<strong>` instead.
 */
export function Rich({
  text,
  em = (s, i) => (
    <span key={i} className="text-body">
      {s}
    </span>
  ),
}: {
  text: string;
  em?: (s: string, i: number) => ReactNode;
}) {
  return (
    <>
      {segments(text).map((seg, i) =>
        seg.em ? em(seg.text, i) : <span key={i}>{seg.text}</span>,
      )}
    </>
  );
}
