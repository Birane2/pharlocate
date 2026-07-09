export default function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-xl bg-white shadow-sm" />
      ))}
    </div>
  );
}
