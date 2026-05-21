import Badge from "../ui/Badge";

const statusConfig = {
  en_attente: { variant: "warning", label: "En attente" },
  confirmee: { variant: "success", label: "Confirmee" },
  prete: { variant: "info", label: "Prete" },
  recuperee: { variant: "active", label: "Recuperee" },
  annulee: { variant: "danger", label: "Annulee" },
};

function ReservationStatusBadge({ status }) {
  const config = statusConfig[status] || { variant: "blue", label: status || "Inconnu" };
  return (
    <Badge variant={config.variant} showIcon>
      {config.label}
    </Badge>
  );
}

export default ReservationStatusBadge;
