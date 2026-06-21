import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

const commonOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxHeight: 8,
        boxWidth: 8,
        color: "#6B7280",
        font: { family: "Poppins, system-ui, sans-serif", size: 10, weight: 600 },
        usePointStyle: true,
      },
    },
  },
};

function ChartCard({ title, children }) {
  return (
    <article className="rounded-2xl border border-pharmaBorder bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-[#1C2B4A]">{title}</h3>
      <div className="mt-3 h-44">{children}</div>
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

function CompactCharts({ stocks, reservations, charts = {}, payments = {} }) {
  const reservationsByStatus = charts.reservations_by_status || {};
  const paymentsByStatus = charts.payments_by_status || {};
  const monthlyRevenue = charts.monthly_revenue || [];
  const reservationData = {
    labels: ["Attente", "Confirmees", "Pretes", "Livrees", "Refusees"],
    datasets: [
      {
        data: [
          reservationsByStatus.en_attente ?? reservations.en_attente,
          reservationsByStatus.confirmee ?? reservations.confirmees,
          reservationsByStatus.prete ?? reservations.pretes ?? 0,
          reservationsByStatus.livree ?? reservations.recuperees,
          reservationsByStatus.refusee ?? reservations.refusees ?? 0,
        ],
        backgroundColor: ["#F59E0B", "#2F6E9E", "#5EC6B8", "#2FA6A3", "#EF4444"],
        borderColor: "#FFFFFF",
        borderWidth: 3,
      },
    ],
  };

  const revenueData = {
    labels: monthlyRevenue.map((item) => formatMonth(item.month)),
    datasets: [
      {
        label: "Revenus",
        data: monthlyRevenue.map((item) => Number(item.revenue || 0)),
        borderColor: "#2F6E9E",
        backgroundColor: "rgba(47,110,158,0.12)",
        pointBackgroundColor: "#2FA6A3",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const paymentData = {
    labels: ["Attente", "Valides", "Refuses", "Rembourses"],
    datasets: [
      {
        data: [
          paymentsByStatus.pending ?? payments.pending ?? 0,
          paymentsByStatus.validated ?? payments.validated ?? 0,
          paymentsByStatus.rejected ?? payments.rejected ?? 0,
          paymentsByStatus.refunded ?? payments.refunded ?? 0,
        ],
        backgroundColor: ["#F59E0B", "#2FA6A3", "#EF4444", "#4A8BBE"],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const stockData = {
    labels: ["Disponibles", "Faibles", "Ruptures"],
    datasets: [
      {
        data: [stocks.disponibles, stocks.faibles, stocks.rupture],
        backgroundColor: ["#2FA6A3", "#F59E0B", "#EF4444"],
        borderColor: "#FFFFFF",
        borderWidth: 3,
      },
    ],
  };

  return (
    <section className="dashboard-reveal">
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2FA6A3]">
          Analyse
        </p>
        <h2 className="mt-1 text-base font-bold text-[#1C2B4A]">
          Vue compacte de l'activite
        </h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Reservations par statut">
          <Doughnut
            data={reservationData}
            options={{ ...commonOptions, cutout: "64%" }}
          />
        </ChartCard>
        <ChartCard title="Revenus mensuels">
          <Line
            data={revenueData}
            options={{
              ...commonOptions,
              plugins: { ...commonOptions.plugins, legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#6B7280" } },
                y: { beginAtZero: true, grid: { color: "rgba(47,110,158,0.08)" } },
              },
            }}
          />
        </ChartCard>
        <ChartCard title="Paiements">
          <Bar
            data={paymentData}
            options={{
              ...commonOptions,
              plugins: { ...commonOptions.plugins, legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#6B7280" } },
                y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(47,110,158,0.08)" } },
              },
            }}
          />
        </ChartCard>
        <ChartCard title="Stocks faibles / rupture">
          <Bar
            data={stockData}
            options={{
              ...commonOptions,
              plugins: { ...commonOptions.plugins, legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "#6B7280" } },
                y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(47,110,158,0.08)" } },
              },
            }}
          />
        </ChartCard>
      </div>
    </section>
  );
}

export default CompactCharts;
