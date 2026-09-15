export default function AccountLoading() {
  return (
    <div aria-busy="true" aria-label="Loading account" className="space-y-6">
      <div className="h-24 animate-pulse rounded-lg bg-[#e8ebf0]" />
      <div className="h-[440px] animate-pulse rounded-lg bg-[#e8ebf0]" />
    </div>
  );
}
