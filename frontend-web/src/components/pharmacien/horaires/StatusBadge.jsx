function StatusBadge({ type = "open", value = false }) {
  const config = {
    open: value
      ? "bg-pharmaGreenLight/20 text-pharmaTurquoise"
      : "bg-pharmaDanger/10 text-pharmaDanger",
    garde: value
      ? "bg-orange-100 text-orange-700"
      : "bg-pharmaSurface text-pharmaTextLight",
  };

  const label = {
    open: value ? "Ouvert" : "Fermé",
    garde: value ? "Oui" : "Non",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config[type]}`}
    >
      {label[type]}
    </span>
  );
}

export default StatusBadge;
