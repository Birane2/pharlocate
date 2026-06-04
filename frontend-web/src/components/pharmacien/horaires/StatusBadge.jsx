function StatusBadge({ type = "open", value = false }) {
  const config = {
    open: value
      ? "bg-[#5EC6B8]/20 text-[#167769]"
      : "bg-red-50 text-red-600",
    garde: value
      ? "bg-orange-50 text-orange-700"
      : "bg-[#F1F5F9] text-[#6B7280]",
  };

  const label = {
    open: value ? "Ouvert" : "Ferme",
    garde: value ? "Oui" : "Non",
  };

  return (
    <span
      className={`inline-flex min-w-16 items-center justify-center rounded-full px-3 py-1 text-xs font-bold ${config[type]}`}
    >
      {label[type]}
    </span>
  );
}

export default StatusBadge;
