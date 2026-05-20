import Card from "../ui/Card";

function StockSkeleton() {
  return (
    <Card
      hover={false}
      className="animate-pulse border-[#2F6E9E]/10 bg-white/95 shadow-[0_18px_42px_rgba(47,110,158,0.06)]"
    >
      <div className="space-y-4">
        <div className="h-44 rounded-[1.4rem] bg-[#2F6E9E]/10" />
        <div className="flex gap-2">
          <div className="h-6 w-24 rounded-full bg-[#2F6E9E]/10" />
          <div className="h-6 w-20 rounded-full bg-[#2F6E9E]/10" />
        </div>
        <div className="h-6 w-3/4 rounded-full bg-[#2F6E9E]/10" />
        <div className="h-4 w-full rounded-full bg-[#2F6E9E]/10" />
        <div className="h-4 w-5/6 rounded-full bg-[#2F6E9E]/10" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-20 rounded-2xl bg-[#2F6E9E]/10" />
          <div className="h-20 rounded-2xl bg-[#2F6E9E]/10" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-11 rounded-2xl bg-[#2F6E9E]/10" />
          <div className="h-11 rounded-2xl bg-[#2F6E9E]/10" />
        </div>
      </div>
    </Card>
  );
}

export default StockSkeleton;
