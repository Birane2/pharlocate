import { useState } from "react";
import Button from "../ui/Button";

function RejectReasonModal({ open, pharmacy, loading = false, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");

  if (!open || !pharmacy) {
    return null;
  }

  const canSubmit = reason.trim().length >= 3;
  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1F2937]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-[0_30px_90px_rgba(31,41,55,0.25)]">
        <h2 className="text-xl font-semibold tracking-tight text-pharmaText">
          Refuser la pharmacie
        </h2>
        <p className="mt-2 text-sm font-normal leading-6 text-pharmaTextLight">
          Indiquez un motif clair pour informer le pharmacien de la raison du refus.
        </p>

        <div className="mt-5 rounded-2xl bg-pharmaSurface p-4">
          <p className="text-sm font-semibold text-pharmaText">{pharmacy.nom}</p>
          <p className="mt-1 text-sm text-pharmaTextLight">{pharmacy.adresse}</p>
        </div>

        <label className="mt-5 block text-sm font-semibold text-pharmaText">
          Motif de refus
        </label>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-[#2F6E9E]/15 bg-white px-4 py-3 text-sm leading-6 text-pharmaText outline-none transition focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#35C3A3]/20"
          placeholder="Ex : Informations incomplètes, coordonnées invalides..."
        />

        {!canSubmit && (
          <p className="mt-2 text-xs font-medium text-orange-700">
            Le motif doit contenir au moins 3 caractères.
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!canSubmit}
            loading={loading}
          >
            Refuser
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RejectReasonModal;
