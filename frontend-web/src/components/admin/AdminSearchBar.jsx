import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCalendarCheck,
  faCreditCard,
  faFileInvoice,
  faHospital,
  faMagnifyingGlass,
  faReceipt,
  faTruck,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const CATEGORIES = [
  { id: "pharmacies", label: "Pharmacies", icon: faHospital, path: "/admin/pharmacies", cls: "text-[#2F6E9E] bg-[#2F6E9E]/10" },
  { id: "users", label: "Utilisateurs", icon: faUsers, path: "/admin/users", cls: "text-[#7C3AED] bg-[#8B5CF6]/10" },
  { id: "payments", label: "Paiements", icon: faCreditCard, path: "/admin/payments", cls: "text-[#047857] bg-[#10B981]/10" },
  { id: "transactions", label: "Transactions", icon: faReceipt, path: "/admin/transactions", cls: "text-[#B45309] bg-[#F59E0B]/10" },
  { id: "reservations", label: "Réservations", icon: faCalendarCheck, path: "/admin/reservations", cls: "text-[#4A8BBE] bg-[#4A8BBE]/10" },
  { id: "deliveries", label: "Livraisons", icon: faTruck, path: "/admin/deliveries", cls: "text-[#2FA6A3] bg-[#2FA6A3]/10" },
  { id: "invoices", label: "Factures", icon: faFileInvoice, path: "/admin/finance/commission-invoices", cls: "text-[#DC2626] bg-[#EF4444]/10" },
];

export default function AdminSearchBar({ className = "", onClose }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut "/" to focus (only when not already in an input)
  useEffect(() => {
    function handler(e) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleNavigate = (path) => {
    const target = query.trim()
      ? `${path}?search=${encodeURIComponent(query.trim())}`
      : path;
    navigate(target);
    setOpen(false);
    setQuery("");
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      onClose?.();
    }
    if (e.key === "Enter" && CATEGORIES[0]) {
      handleNavigate(CATEGORIES[0].path);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="flex h-9 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 transition focus-within:border-[#2F6E9E]/50 focus-within:bg-white focus-within:shadow-sm">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher une pharmacie, un utilisateur…"
          className="flex-1 bg-transparent text-xs text-[#1C2B4A] placeholder-[#9CA3AF] outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="shrink-0 text-[#9CA3AF] transition hover:text-[#6B7280]"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded-md border border-[#E5E7EB] px-1.5 py-0.5 text-[10px] font-semibold text-[#9CA3AF] sm:block">
            /
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[300px] overflow-hidden rounded-xl border border-[#E2E8F2] bg-white shadow-xl">
          <p className="border-b border-[#F1F5F9] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">
            {query.trim() ? `Rechercher "${query.trim()}" dans…` : "Accès rapide"}
          </p>
          <ul className="py-1">
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleNavigate(cat.path);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-[#F8FAFC]"
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${cat.cls}`}>
                    <FontAwesomeIcon icon={cat.icon} className="h-3 w-3" />
                  </span>
                  <span className="flex-1 text-xs font-semibold text-[#1C2B4A]">
                    {query.trim() ? `${cat.label}` : cat.label}
                  </span>
                  <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3 text-[#9CA3AF]" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
