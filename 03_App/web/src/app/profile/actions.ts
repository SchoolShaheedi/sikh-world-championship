"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, destroySession } from "@/lib/auth";

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  // Server-side first. Clearing the cookie alone would leave a bearer token that still
  // works for anyone who copied it — the whole point on a shared or family computer.
  await destroySession(token);
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
