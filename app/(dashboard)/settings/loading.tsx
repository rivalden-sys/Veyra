export default function SettingsLoading() {
  return (
    <section className="space-y-6" aria-busy="true" aria-label="Loading workspace settings">
      <div className="h-24 animate-pulse rounded-lg bg-[#eef1f5]" />
      <div className="h-80 animate-pulse rounded-lg bg-[#eef1f5]" />
    </section>
  );
}
