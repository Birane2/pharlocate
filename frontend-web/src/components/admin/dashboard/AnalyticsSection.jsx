import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { Bar, Doughnut, Line } from "react-chartjs-2";

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "60%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxWidth: 8,
        usePointStyle: true,
        pointStyle: "circle",
        color: "#6B7280",
        font: { size: 10, weight: "600" },
        padding: 10,
      },
    },
    tooltip: {
      backgroundColor: "#fff",
      titleColor: "#1C2B4A",
      bodyColor: "#1C2B4A",
      borderColor: "#E2E8F2",
      borderWidth: 1,
      displayColors: false,
    },
  },
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#fff",
      titleColor: "#1C2B4A",
      bodyColor: "#1C2B4A",
      borderColor: "#E2E8F2",
      borderWidth: 1,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#6B7280", font: { size: 10, weight: "600" } },
    },
    y: {
      beginAtZero: true,
      grid: { color: "#EEF2F7" },
      ticks: { precision: 0, color: "#6B7280", font: { size: 10 } },
    },
  },
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#fff",
      titleColor: "#1C2B4A",
      bodyColor: "#1C2B4A",
      borderColor: "#E2E8F2",
      borderWidth: 1,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#6B7280", font: { size: 10, weight: "600" } },
    },
    y: {
      beginAtZero: true,
      grid: { color: "#EEF2F7" },
      ticks: { precision: 0, color: "#6B7280", font: { size: 10 } },
    },
  },
};

function ChartCard({ title, children }) {
  return (
    <article className="rounded-xl border border-[#E2E8F2] bg-white p-3 shadow-sm">
      <h3 className="text-xs font-bold text-[#1C2B4A]">{title}</h3>
      <div className="mt-2 h-[200px]">{children}</div>
    </article>
  );
}

function formatMonth(value) {
  if (!value) return "";
  const [year, month] = String(value).split("-");
  if (!year || !month) return value;
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(
    new Date(Number(year), Number(month) - 1, 1)
  );
}

export default function AnalyticsSection({ charts, periodKey }) {
  const revenueByMonthData = useMemo(
    () => ({
      labels: (charts.revenue_by_month || []).map((item) => formatMonth(item.month)),
      datasets: [
        {
          label: "Revenus",
          data: (charts.revenue_by_month || []).map((item) => Number(item.amount || 0)),
          borderColor: "#2FA6A3",
          backgroundColor: "rgba(47,166,163,0.1)",
          pointBackgroundColor: "#2F6E9E",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
      ],
    }),
    [charts.revenue_by_month]
  );

  const reservationsByMonthData = useMemo(
    () => ({
      labels: (charts.reservations_by_month || []).map((item) => formatMonth(item.month)),
      datasets: [
        {
          label: "Réservations",
          data: (charts.reservations_by_month || []).map((item) => item.count || 0),
          borderColor: "#2F6E9E",
          backgroundColor: "rgba(47,110,158,0.1)",
          pointBackgroundColor: "#2FA6A3",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
      ],
    }),
    [charts.reservations_by_month]
  );

  const subscriptionsData = useMemo(() => {
    const plans = charts.subscriptions_by_plan || {};
    return {
      labels: ["Gratuit", "Standard", "Premium"],
      datasets: [
        {
          data: [plans.free || 0, plans.standard || 0, plans.premium || 0],
          backgroundColor: ["#4A8BBE", "#2FA6A3", "#1C2B4A"],
          borderColor: "#fff",
          borderWidth: 4,
          hoverOffset: 5,
        },
      ],
    };
  }, [charts.subscriptions_by_plan]);

  const paymentsData = useMemo(() => {
    const ps = charts.payments_by_status || {};
    return {
      labels: ["Attente", "Validés", "Refusés", "Remb."],
      datasets: [
        {
          label: "Paiements",
          data: [ps.pending || 0, ps.validated || 0, ps.rejected || 0, ps.refunded || 0],
          backgroundColor: ["#F59E0B", "#2FA6A3", "#EF4444", "#4A8BBE"],
          borderRadius: 8,
          maxBarThickness: 32,
        },
      ],
    };
  }, [charts.payments_by_status]);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <FontAwesomeIcon icon={faChartLine} className="h-3.5 w-3.5 text-[#2F6E9E]" />
        <h2 className="text-sm font-bold text-[#1C2B4A]">Analyse</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChartCard title="Revenus mensuels">
          <Line key={`revenue-${periodKey}`} data={revenueByMonthData} options={lineOptions} />
        </ChartCard>
        <ChartCard title="Réservations par mois">
          <Line key={`res-month-${periodKey}`} data={reservationsByMonthData} options={lineOptions} />
        </ChartCard>
        <ChartCard title="Abonnements par plan">
          <Doughnut key={`subs-${periodKey}`} data={subscriptionsData} options={doughnutOptions} />
        </ChartCard>
        <ChartCard title="Paiements par statut">
          <Bar key={`pay-${periodKey}`} data={paymentsData} options={barOptions} />
        </ChartCard>
      </div>
    </section>
  );
}
