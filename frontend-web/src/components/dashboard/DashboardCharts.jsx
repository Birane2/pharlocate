import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const palette = {
  blue: "#2F6E9E",
  lightBlue: "#4A8BBE",
  turquoise: "#2FA6A3",
  green: "#35C3A3",
  accent: "#1681FF",
  orange: "#F59E0B",
  red: "#EF4444",
  softGrid: "rgba(47, 110, 158, 0.08)",
};

const chartFont = {
  family: "Inter, Poppins, system-ui, sans-serif",
  weight: 700,
};

function ChartPanel({ eyebrow, title, description, children }) {
  return (
    <section className="dashboard-reveal rounded-3xl border border-pharmaBorder bg-white/90 p-5 shadow-soft backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-dashboard">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0085AA]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-black text-pharmaText">{title}</h2>
      <p className="mt-1 text-sm text-pharmaTextLight">{description}</p>
      <div className="mt-6 h-72">{children}</div>
    </section>
  );
}

function DashboardCharts({ stocks, reservations, horaires, avis }) {
  const reservationData = {
    labels: ["En attente", "Confirmées", "Récupérées", "Annulées"],
    datasets: [
      {
        label: "Réservations",
        data: [
          reservations.en_attente,
          reservations.confirmees,
          reservations.recuperees,
          reservations.annulees,
        ],
        backgroundColor: [
          palette.orange,
          palette.accent,
          palette.green,
          palette.red,
        ],
        borderRadius: 14,
        borderSkipped: false,
      },
    ],
  };

  const stockData = {
    labels: ["Disponibles", "Stocks faibles", "Ruptures"],
    datasets: [
      {
        data: [stocks.disponibles, stocks.faibles, stocks.rupture],
        backgroundColor: [palette.green, palette.orange, palette.red],
        borderColor: "#FFFFFF",
        borderWidth: 5,
        hoverOffset: 8,
      },
    ],
  };

  const statusData = {
    labels: ["Médicaments", "Réservations", "Horaires", "Avis"],
    datasets: [
      {
        data: [
          stocks.total,
          reservations.total,
          horaires.total,
          avis.total,
        ],
        backgroundColor: [
          palette.blue,
          palette.turquoise,
          palette.accent,
          palette.lightBlue,
        ],
        borderColor: "#FFFFFF",
        borderWidth: 5,
      },
    ],
  };

  const commonOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          color: "#1F2937",
          font: chartFont,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "#1F2937",
        padding: 12,
        titleFont: chartFont,
        bodyFont: { family: chartFont.family },
      },
    },
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6B7280", font: chartFont },
      },
      y: {
        beginAtZero: true,
        grid: { color: palette.softGrid },
        ticks: { precision: 0, color: "#6B7280" },
      },
    },
  };

  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <ChartPanel
        eyebrow="Analyse"
        title="Réservations"
        description="Répartition opérationnelle des demandes patients."
      >
        <Bar data={reservationData} options={barOptions} />
      </ChartPanel>

      <ChartPanel
        eyebrow="Inventaire"
        title="État du stock"
        description="Lecture rapide des disponibilités et alertes."
      >
        <Doughnut data={stockData} options={{ ...commonOptions, cutout: "64%" }} />
      </ChartPanel>

      <ChartPanel
        eyebrow="Pilotage"
        title="Statuts clés"
        description="Vue synthétique des volumes suivis au quotidien."
      >
        <Pie data={statusData} options={commonOptions} />
      </ChartPanel>
    </section>
  );
}

export default DashboardCharts;
