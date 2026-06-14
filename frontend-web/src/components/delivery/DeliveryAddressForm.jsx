import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faPhone, faNoteSticky } from "@fortawesome/free-solid-svg-icons";

function Field({ icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#1C2B4A]">
        <FontAwesomeIcon icon={icon} className="text-[#2F6E9E]" />
        {label}
      </span>
      {children}
    </label>
  );
}

function DeliveryAddressForm({
  values,
  onChange,
  locationStatus,
  disabled = false,
}) {
  const inputClass =
    "w-full rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 text-sm font-semibold text-[#1C2B4A] outline-none transition focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#2FA6A3]/10";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#2FA6A3]/20 bg-[#E8F7F3] px-4 py-3 text-sm font-semibold text-[#167769]">
        {locationStatus || "La position GPS sera recuperee automatiquement."}
      </div>

      <Field icon={faLocationDot} label="Adresse de livraison">
        <textarea
          disabled={disabled}
          value={values.address}
          onChange={(event) => onChange("address", event.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Ex: Tevragh Zeina, pres de..."
        />
      </Field>

      <Field icon={faPhone} label="Telephone de livraison">
        <input
          disabled={disabled}
          value={values.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          className={inputClass}
          placeholder="+22233613535"
        />
      </Field>

      <Field icon={faNoteSticky} label="Note optionnelle">
        <input
          disabled={disabled}
          value={values.note}
          onChange={(event) => onChange("note", event.target.value)}
          className={inputClass}
          placeholder="Instruction pour le livreur"
        />
      </Field>
    </div>
  );
}

export default DeliveryAddressForm;
