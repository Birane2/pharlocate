import Button from "../ui/Button";

function ReservationActions({
  reservation,
  loading = false,
  onConfirm,
  onCancel,
  onReady,
  onPickedUp,
}) {
  if (reservation.statut === "en_attente") {
    return (
      <>
        <Button
          className="px-4 py-2"
          loading={loading}
          disabled={loading}
          onClick={() => onConfirm(reservation.id)}
        >
          Confirmer
        </Button>
        <Button
          variant="danger"
          className="px-4 py-2"
          disabled={loading}
          onClick={() => onCancel(reservation.id)}
        >
          Refuser
        </Button>
      </>
    );
  }

  if (reservation.statut === "confirmee") {
    return (
      <Button
        variant="secondary"
        className="px-4 py-2"
        loading={loading}
        disabled={loading}
        onClick={() => onReady(reservation.id)}
      >
        Marquer prete
      </Button>
    );
  }

  if (reservation.statut === "prete") {
    return (
      <Button
        variant="secondary"
        className="bg-pharmaGreenLight px-4 py-2 hover:bg-pharmaTurquoise"
        loading={loading}
        disabled={loading}
        onClick={() => onPickedUp(reservation.id)}
      >
        Marquer recuperee
      </Button>
    );
  }

  return null;
}

export default ReservationActions;
