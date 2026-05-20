import Badge from "../ui/Badge";

export function getStockStatus(stock) {
  const quantite = Number(stock?.quantite || 0);
  const seuilAlerte = Number(stock?.seuil_alerte || 0);

  if (stock?.status === "rupture" || quantite === 0) {
    return "rupture";
  }

  if (
    stock?.status === "faible" ||
    (quantite > 0 && quantite < seuilAlerte)
  ) {
    return "faible";
  }

  return "disponible";
}

export function getStockStatusLabel(stock) {
  if (stock?.status_label) {
    return stock.status_label;
  }

  const status = getStockStatus(stock);

  if (status === "rupture") {
    return "Rupture";
  }

  if (status === "faible") {
    return "Faible stock";
  }

  return "Disponible";
}

function getStatusVariant(status) {
  if (status === "rupture") {
    return "danger";
  }

  if (status === "faible") {
    return "warning";
  }

  return "success";
}

function StockStatusBadge({ stock, className = "" }) {
  const status = getStockStatus(stock);
  const label = getStockStatusLabel(stock);

  return (
    <Badge variant={getStatusVariant(status)} showIcon className={className}>
      {label}
    </Badge>
  );
}

export default StockStatusBadge;
