import AdminStatsCard from "../AdminStatsCard";
import DashboardSkeleton from "./DashboardSkeleton";

export default function DashboardKpiGrid({ cards, loading }) {
  if (loading) return <DashboardSkeleton />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <AdminStatsCard key={card.label} {...card} />
      ))}
    </div>
  );
}
