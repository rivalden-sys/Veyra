const missingEnv = (name: string) =>
  new Error(`Missing required environment variable: ${name}`);

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw missingEnv("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!publishableKey) {
    throw missingEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return { url, publishableKey };
}
