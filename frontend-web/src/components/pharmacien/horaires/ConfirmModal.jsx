import Button from "../../ui/Button";

function ConfirmModal({
  open,
  title = "Confirmation",
  message,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-soft">
        <h3 className="text-xl font-bold text-pharmaBlue">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-pharmaTextLight">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" className="px-4 py-2" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="danger"
            className="px-4 py-2"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
