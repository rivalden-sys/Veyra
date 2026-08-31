import { NextResponse } from "next/server";
import { logAuthFailure } from "@/lib/auth/errors";
import { buildAppUrl } from "@/lib/auth/routing";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_TENANT_COOKIE } from "@/lib/tenant/context";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    logAuthFailure("sign_out", error);
  }

  let response: NextResponse;

  try {
    response = NextResponse.redirect(buildAppUrl("/login"), 303);
  } catch (configurationError) {
    logAuthFailure("sign_out_origin_configuration", configurationError);
    response = NextResponse.json(
      { error: "Sign-out completed, but the application redirect is unavailable." },
      { status: 500 },
    );
  }

  response.cookies.delete(ACTIVE_TENANT_COOKIE);

  return response;
}
