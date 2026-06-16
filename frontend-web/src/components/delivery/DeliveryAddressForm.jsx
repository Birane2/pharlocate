import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faNoteSticky, faCircleCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

function Field({ icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#1C2B4A]">
        <FontAwesomeIcon icon={icon} className="text-[#2F6E9E] text-[10px]" />
        {label}
      </span>
      {children}
    </label>
  );
}

function DeliveryAddressForm({ values, onChange, locationStatus, disabled = false }) {
  const inputClass =
    "w-full rounded-xl border border-[#E2E8F2] bg-white px-3 py-2 text-sm text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-2 focus:ring-[#2FA6A3]/10 disabled:bg-[#F8FAFC] disabled:opacity-70";

  const gpsOk = locationStatus?.includes("recuperee") || locationStatus?.includes("automatiquement");

  return (
    <div className="space-y-2.5">
      {/* GPS status */}
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
          gpsOk
            ? "border-[#2FA6A3]/25 bg-[#E8F7F3] text-[#167769]"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        <FontAwesomeIcon
          icon={gpsOk ? faCircleCheck : faTriangleExclamation}
          className="shrink-0"
        />
        <span>{locationStatus || "Recuperation de la position GPS..."}</span>
      </div>

      <Field icon={faLocationDot} label="Adresse de livraison">
        <textarea
          disabled={disabled}
          value={values.address}
          onChange={(e) => onChange("address", e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Ex: Tevragh Zeina, pres de..."
        />
      </Field>

      <Field icon={faNoteSticky} label="Note pour le livreur (optionnelle)">
        <input
          disabled={disabled}
          value={values.note}
          onChange={(e) => onChange("note", e.target.value)}
          className={inputClass}
          placeholder="Batiment, etage, point de repere..."
        />
      </Field>
    </div>
  );
}

export default DeliveryAddressForm;
