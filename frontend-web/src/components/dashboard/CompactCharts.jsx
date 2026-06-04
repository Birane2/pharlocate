import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip);

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

function CompactCharts({ stocks, reservations }) {
  const reservationData = {
    labels: ["Attente", "Confirmees", "Recuperees", "Annulees"],
    datasets: [
      {
        data: [
          reservations.en_attente,
          reservations.confirmees,
          reservations.recuperees,
          reservations.annulees,
        ],
        backgroundColor: ["#F59E0B", "#2FA6A3", "#5EC6B8", "#EF4444"],
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
        <ChartCard title="Reservations">
          <Bar
            data={reservationData}
            options={{
              ...commonOptions,
              scales: {
                x: { grid: { display: false }, ticks: { color: "#6B7280" } },
                y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(47,110,158,0.08)" } },
              },
            }}
          />
        </ChartCard>
        <ChartCard title="Etat du stock">
          <Doughnut
            data={stockData}
            options={{ ...commonOptions, cutout: "66%" }}
          />
        </ChartCard>
      </div>
    </section>
  );
}

export default CompactCharts;
