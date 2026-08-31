"use server";

import { redirect } from "next/navigation";
import type { AuthErrorCode } from "@/lib/auth/errors";
import { logAuthFailure } from "@/lib/auth/errors";
import { buildAuthCallbackUrl, safeAuthNext } from "@/lib/auth/routing";
import { createClient } from "@/lib/supabase/server";

function loginErrorPath(error: AuthErrorCode, next: string): string {
  const params = new URLSearchParams({ error, next });
  return `/login?${params.toString()}`;
}

function callbackUrl(next: string): string {
  try {
    return buildAuthCallbackUrl(next);
  } catch (error) {
    logAuthFailure("callback_url_configuration", error);
    redirect(loginErrorPath("auth_configuration_error", next));
  }
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = safeAuthNext(formData.get("next"));

  if (!email) {
    redirect(loginErrorPath("email_required", next));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl(next),
      shouldCreateUser: true,
    },
  });

  if (error) {
    logAuthFailure("magic_link_send", error);
    redirect(loginErrorPath("magic_link_failed", next));
  }

  const successParams = new URLSearchParams({ sent: "1", next });
  redirect(`/login?${successParams.toString()}`);
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeAuthNext(formData.get("next"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl(next),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    logAuthFailure("google_sign_in", error);
    redirect(loginErrorPath("google_sign_in_failed", next));
  }

  if (!data.url) {
    logAuthFailure("google_redirect_missing", new Error("OAuth redirect URL missing"));
    redirect(loginErrorPath("google_redirect_unavailable", next));
  }

  redirect(data.url);
}
