import { Mail } from "lucide-react";
import { redirect } from "next/navigation";
import {
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
} from "@/app/(auth)/login/actions";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    sent?: string;
    email?: string;
    next?: string;
  }>;
};

function safeNext(next: string | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
      <section className="w-full rounded-lg border border-[#dde2ea] bg-white p-6 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
            Veyra
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-[#15171a]">
            Sign in
          </h1>
        </div>

        {params.error ? (
          <div className="mb-5 rounded-md border border-[#f2b8b5] bg-[#fff4f2] px-4 py-3 text-sm text-[#9f251f]">
            {params.error}
          </div>
        ) : null}

        {params.sent ? (
          <div className="mb-5 rounded-md border border-[#b8d9cc] bg-[#effaf5] px-4 py-3 text-sm text-[#0f5f4d]">
            Magic link sent to {params.email}.
          </div>
        ) : null}

        <form action={signInWithGoogle} className="mb-5">
          <input name="next" type="hidden" value={next} />
          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#cfd6e1] bg-white px-4 text-sm font-semibold text-[#15171a] transition hover:bg-[#f1f4f8]"
            type="submit"
          >
            <span aria-hidden="true" className="text-base font-bold">
              G
            </span>
            Continue with Google
          </button>
        </form>

        <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-[#738092]">
          <span className="h-px flex-1 bg-[#dde2ea]" />
          Email
          <span className="h-px flex-1 bg-[#dde2ea]" />
        </div>

        <form className="space-y-4">
          <input name="next" type="hidden" value={next} />
          <label className="block text-sm font-medium text-[#333942]" htmlFor="email">
            Email address
          </label>
          <div className="flex items-center rounded-md border border-[#cfd6e1] bg-white px-3">
            <Mail aria-hidden="true" className="mr-2 h-4 w-4 text-[#667085]" />
            <input
              autoComplete="email"
              className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>
          <label className="block text-sm font-medium text-[#333942]" htmlFor="password">
            Password
          </label>
          <input
            autoComplete="current-password"
            className="h-11 w-full rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
            id="password"
            name="password"
            required
            type="password"
          />
          <button
            className="flex h-11 w-full items-center justify-center rounded-md border border-[#cfd6e1] bg-white px-4 text-sm font-semibold text-[#15171a] transition hover:bg-[#f1f4f8]"
            formAction={signInWithPassword}
            type="submit"
          >
            Sign in with password
          </button>
          <button
            className="h-11 w-full rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b615b]"
            formAction={signInWithMagicLink}
            type="submit"
          >
            Send magic link
          </button>
        </form>
      </section>
    </div>
  );
}
