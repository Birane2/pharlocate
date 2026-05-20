function PharmacieStatusBadge({ isValid }) {
  const className = isValid
    ? "bg-pharmaGreenLight/20 text-pharmaTurquoise"
    : "bg-orange-100 text-orange-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {isValid ? "Validee" : "En attente"}
    </span>
  );
}

export default PharmacieStatusBadge;
