import { MailCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { acceptWorkspaceInvitation } from "@/app/invite/[token]/actions";
import { createClient } from "@/lib/supabase/server";

type InvitePageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { token } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-10 text-[#15171a]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center">
        <section className="w-full rounded-lg border border-[#dde2ea] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#e7f5f2] text-[#0f766e]">
              <MailCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
                Veyra
              </p>
              <h1 className="text-2xl font-semibold">Workspace invitation</h1>
            </div>
          </div>

          <p className="text-sm text-[#59616d]">
            You are signed in as <strong>{user.email}</strong>. Accepting this invitation will add this account to the workspace and make it active.
          </p>

          {query.error ? (
            <div className="mt-5 rounded-md border border-[#f2b8b5] bg-[#fff4f2] px-4 py-3 text-sm text-[#9f251f]">
              {query.error}
            </div>
          ) : null}

          <form action={acceptWorkspaceInvitation} className="mt-6">
            <input name="token" type="hidden" value={token} />
            <button
              className="h-11 w-full rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b615b]"
              type="submit"
            >
              Accept invitation
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
