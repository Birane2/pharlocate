const statusStyles = {
  en_attente: "bg-amber-50 text-amber-700 ring-amber-200",
  en_cours: "bg-blue-50 text-blue-700 ring-blue-200",
  livree: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  annulee: "bg-red-50 text-red-700 ring-red-200",
};

const statusLabels = {
  en_attente: "En attente",
  en_cours: "En cours",
  livree: "Livree",
  annulee: "Annulee",
};

function DeliveryStatusBadge({ status }) {
  const normalized = status || "en_attente";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${
        statusStyles[normalized] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {statusLabels[normalized] || normalized}
    </span>
  );
}

export default DeliveryStatusBadge;
