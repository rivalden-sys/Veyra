import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/onboarding/actions";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-10 text-[#15171a]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center">
        <section className="w-full rounded-lg border border-[#dde2ea] bg-white p-6 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#e7f5f2] text-[#0f766e]">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
                Veyra
              </p>
              <h1 className="text-2xl font-semibold tracking-normal">
                Create garage
              </h1>
            </div>
          </div>

          {params.error ? (
            <div className="mb-5 rounded-md border border-[#f2b8b5] bg-[#fff4f2] px-4 py-3 text-sm text-[#9f251f]">
              {params.error}
            </div>
          ) : null}

          <form action={completeOnboarding} className="space-y-5">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-[#333942]"
                htmlFor="tenantName"
              >
                Garage name
              </label>
              <input
                autoComplete="organization"
                className="h-11 w-full rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
                id="tenantName"
                name="tenantName"
                required
                minLength={2}
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-[#333942]"
                htmlFor="tenantSlug"
              >
                URL slug
              </label>
              <input
                autoComplete="off"
                className="h-11 w-full rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
                id="tenantSlug"
                name="tenantSlug"
                pattern="[a-z0-9-]{3,64}"
                placeholder="northside-auto"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-[#333942]"
                htmlFor="tenantTimezone"
              >
                Timezone
              </label>
              <select
                className="h-11 w-full rounded-md border border-[#cfd6e1] bg-white px-3 text-sm outline-none"
                defaultValue="UTC"
                id="tenantTimezone"
                name="tenantTimezone"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/Denver">America/Denver</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/Warsaw">Europe/Warsaw</option>
              </select>
            </div>

            <button
              className="h-11 w-full rounded-md bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b615b]"
              type="submit"
            >
              Continue
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
