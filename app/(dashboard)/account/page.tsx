import { UserRound } from "lucide-react";
import { updateProfile } from "@/app/(dashboard)/account/actions";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

type AccountPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, full_name, phone, locale")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Unable to load your profile");
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
            Personal
          </p>
          <h1 className="mt-1 text-2xl font-semibold">My account</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#59616d]">
            Keep your profile details current. These details are shared only with
            workspace members who are allowed to see your profile.
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#e7f5f2] text-[#0f766e]">
          <UserRound aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>

      {params.error ? (
        <div
          className="rounded-md border border-[#f2b8b5] bg-[#fff4f2] px-4 py-3 text-sm text-[#9f251f]"
          role="alert"
        >
          {params.error}
        </div>
      ) : null}

      {params.saved ? (
        <div
          className="rounded-md border border-[#b7dfd5] bg-[#eefaf7] px-4 py-3 text-sm text-[#0f5f4d]"
          role="status"
        >
          Profile saved.
        </div>
      ) : null}

      <div className="rounded-lg border border-[#dde2ea] bg-white p-5 shadow-sm">
        <form action={updateProfile} className="max-w-2xl space-y-5">
          <div>
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#dde2ea] bg-[#f7f8fb] px-3 text-sm text-[#667085]"
              disabled
              id="email"
              type="email"
              value={profile.email}
            />
            <p className="mt-2 text-xs text-[#7b8490]">
              Your email is managed by the connected authentication provider.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="fullName">
              Full name
            </label>
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
              defaultValue={profile.full_name ?? ""}
              id="fullName"
              maxLength={120}
              name="fullName"
              placeholder="Your name"
              type="text"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="phone">
              Phone
            </label>
            <input
              autoComplete="tel"
              className="mt-2 h-11 w-full rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
              defaultValue={profile.phone ?? ""}
              id="phone"
              inputMode="tel"
              maxLength={40}
              name="phone"
              placeholder="+48 123 456 789"
              type="tel"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="locale">
              Locale
            </label>
            <input
              autoCapitalize="none"
              autoComplete="language"
              className="mt-2 h-11 w-full rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
              defaultValue={profile.locale}
              id="locale"
              maxLength={35}
              name="locale"
              placeholder="en-US"
              required
              spellCheck={false}
              type="text"
            />
            <p className="mt-2 text-xs text-[#7b8490]">
              Use a language or regional locale such as en-US, pl-PL, or uk-UA.
            </p>
          </div>

          <PendingSubmitButton
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b615b]"
            pendingLabel="Saving..."
          >
            Save profile
          </PendingSubmitButton>
        </form>
      </div>
    </section>
  );
}
