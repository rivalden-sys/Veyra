const AUTH_ERROR_MESSAGES = {
  auth_code_missing: "The sign-in link is incomplete. Start the sign-in process again.",
  auth_exchange_failed: "We couldn't complete sign-in. Please try again.",
  email_required: "Enter your email address.",
  google_redirect_unavailable: "Google sign-in is temporarily unavailable. Please try again.",
  google_sign_in_failed: "We couldn't start Google sign-in. Please try again.",
  magic_link_failed: "We couldn't send a magic link. Please try again.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;

export function authErrorMessage(code: string | undefined): string | null {
  if (!code || !(code in AUTH_ERROR_MESSAGES)) {
    return null;
  }

  return AUTH_ERROR_MESSAGES[code as AuthErrorCode];
}

export function logAuthFailure(context: string, error: unknown): void {
  const details: Record<string, string | number> = {};

  if (error instanceof Error) {
    details.name = error.name;
    details.message = error.message;
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      code?: unknown;
      status?: unknown;
    };

    if (typeof candidate.code === "string") {
      details.code = candidate.code;
    }

    if (typeof candidate.status === "number") {
      details.status = candidate.status;
    }
  }

  console.error(`[auth] ${context}`, details);
}
