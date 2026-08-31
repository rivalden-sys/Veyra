import { NextResponse, type NextRequest } from "next/server";
import type { AuthErrorCode } from "@/lib/auth/errors";
import { logAuthFailure } from "@/lib/auth/errors";
import { buildAppUrl, safeAuthNext } from "@/lib/auth/routing";
import { createClient } from "@/lib/supabase/server";

function loginErrorPath(error: AuthErrorCode, next: string): string {
  const params = new URLSearchParams({ error, next });
  return `/login?${params.toString()}`;
}

function canonicalRedirect(path: string): NextResponse {
  try {
    return NextResponse.redirect(buildAppUrl(path));
  } catch (error) {
    logAuthFailure("canonical_origin_configuration", error);
    return NextResponse.json(
      { error: "Authentication is temporarily unavailable." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAuthNext(requestUrl.searchParams.get("next"));

  if (!code) {
    return canonicalRedirect(loginErrorPath("auth_code_missing", next));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logAuthFailure("code_exchange", error);
      return canonicalRedirect(loginErrorPath("auth_exchange_failed", next));
    }
  } catch (error) {
    logAuthFailure("code_exchange_unexpected", error);
    return canonicalRedirect(loginErrorPath("auth_exchange_failed", next));
  }

  return canonicalRedirect(next);
}
