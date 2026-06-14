import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faUpload } from "@fortawesome/free-solid-svg-icons";

function PaymentProofUpload({ file, onChange, disabled = false }) {
  return (
    <label
      className={`block cursor-pointer rounded-2xl border border-dashed p-4 transition ${
        disabled
          ? "cursor-not-allowed border-[#E2E8F2] bg-[#F8FAFC] opacity-70"
          : "border-[#2F6E9E]/30 bg-[#F8FBFF] hover:border-[#2FA6A3]"
      }`}
    >
      <input
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className="hidden"
      />

      <span className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#2F6E9E] shadow-sm">
          <FontAwesomeIcon icon={file ? faImage : faUpload} />
        </span>
        <span>
          <span className="block text-sm font-black text-[#1C2B4A]">
            {file ? file.name : "Ajouter la capture paiement"}
          </span>
          <span className="mt-1 block text-xs text-[#6B7280]">
            Image JPG, PNG ou capture ecran de la transaction.
          </span>
        </span>
      </span>
    </label>
  );
}

export default PaymentProofUpload;
