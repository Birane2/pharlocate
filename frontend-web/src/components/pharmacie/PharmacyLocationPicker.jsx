import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faLocationDot,
  faPen,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import GoogleMapPicker from "./GoogleMapPicker";

/**
 * PharmacyLocationPicker
 *
 * Props:
 *   value       – current location object or null
 *                 { lat, lng, address, city, region, country, postal_code, google_place_id }
 *   onChange    – called with the location object when pharmacist confirms
 *   disabled    – disable the picker button while form is submitting
 */
export default function PharmacyLocationPicker({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);

  const hasLocation = Boolean(value?.lat && value?.lng);

  const handleConfirm = (location) => {
    onChange(location);
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* ── Button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-[#2F6E9E]/30 bg-[#EEF6FB] px-4 py-3 text-sm font-bold text-[#2F6E9E] transition hover:border-[#2F6E9E]/60 hover:bg-[#2F6E9E]/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2F6E9E]/15 transition group-hover:bg-[#2F6E9E]/25">
          <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: "13px" }} />
        </span>
        {hasLocation ? "Modifier l'emplacement sur Google Maps" : "Choisir sur Google Maps"}
      </button>

      {/* ── Location preview ────────────────────────────────────── */}
      {hasLocation ? (
        <div className="rounded-xl border border-[#2FA6A3]/25 bg-[#E8F7F3] px-4 py-3">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="mt-0.5 shrink-0 text-[#2FA6A3]"
              style={{ fontSize: "14px" }}
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-xs font-bold text-[#167769]">Emplacement enregistré</p>

              {value.address && (
                <p className="text-[11px] leading-relaxed text-[#2FA6A3] line-clamp-2">
                  {value.address}
                </p>
              )}

              {(value.city || value.country) && (
                <p className="text-[11px] text-[#4BA89B]">
                  {[value.city, value.region, value.country].filter(Boolean).join(", ")}
                </p>
              )}

              <p className="font-mono text-[10px] text-[#4BA89B]">
                {Number(value.lat).toFixed(6)}, {Number(value.lng).toFixed(6)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={`https://maps.google.com/?q=${value.lat},${value.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-[#2FA6A3] px-2 py-1 text-[10px] font-bold text-white transition hover:bg-[#248C8A]"
                title="Ouvrir dans Google Maps"
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: "8px" }} />
                Ouvrir
              </a>
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-lg border border-[#2FA6A3]/40 bg-white px-2 py-1 text-[10px] font-bold text-[#2FA6A3] transition hover:bg-[#E8F7F3] disabled:opacity-50"
                title="Modifier l'emplacement"
              >
                <FontAwesomeIcon icon={faPen} style={{ fontSize: "8px" }} />
                Modifier
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">
          <FontAwesomeIcon icon={faTriangleExclamation} className="shrink-0" />
          <span>
            Aucun emplacement enregistré. Cliquez sur le bouton ci-dessus pour positionner
            votre pharmacie sur la carte.
          </span>
        </div>
      )}

      {/* ── Map modal ───────────────────────────────────────────── */}
      {isOpen && (
        <GoogleMapPicker
          onClose={() => setIsOpen(false)}
          onConfirm={handleConfirm}
          initialLocation={hasLocation ? value : null}
        />
      )}
    </div>
  );
}
