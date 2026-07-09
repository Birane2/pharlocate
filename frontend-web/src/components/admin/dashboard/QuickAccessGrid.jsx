import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faClinicMedical,
  faCreditCard,
  faFileInvoice,
  faReceipt,
  faShieldHalved,
  faStar,
  faTruckFast,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const LINKS = [
  {
    label: "Pharmacies",
    icon: faClinicMedical,
    to: "/admin/pharmacies",
    cls: "text-[#2F6E9E] bg-[#2F6E9E]/10",
  },
  {
    label: "Utilisateurs",
    icon: faUsers,
    to: "/admin/users",
    cls: "text-[#7C3AED] bg-[#8B5CF6]/10",
  },
  {
    label: "Paiements",
    icon: faCreditCard,
    to: "/admin/payments",
    cls: "text-[#047857] bg-[#10B981]/10",
  },
  {
    label: "Transactions",
    icon: faReceipt,
    to: "/admin/transactions",
    cls: "text-[#B45309] bg-[#F59E0B]/10",
  },
  {
    label: "Livraisons",
    icon: faTruckFast,
    to: "/admin/deliveries",
    cls: "text-[#2FA6A3] bg-[#2FA6A3]/10",
  },
  {
    label: "Abonnements",
    icon: faShieldHalved,
    to: "/admin/subscription-payments",
    cls: "text-[#7C3AED] bg-[#8B5CF6]/10",
  },
  {
    label: "Factures",
    icon: faFileInvoice,
    to: "/admin/finance/commission-invoices",
    cls: "text-[#DC2626] bg-[#EF4444]/10",
  },
  {
    label: "Avis",
    icon: faStar,
    to: "/admin/reviews",
    cls: "text-[#B45309] bg-[#F59E0B]/10",
  },
  {
    label: "Notifications",
    icon: faBell,
    to: "/admin/notifications",
    cls: "text-[#6B7280] bg-[#6B7280]/10",
  },
];

export default function QuickAccessGrid() {
  return (
    <section className="rounded-xl border border-[#E2E8F2] bg-white p-3 shadow-sm">
      <h2 className="mb-3 text-xs font-bold text-[#1C2B4A]">Gestion rapide</h2>
      <div className="grid grid-cols-3 gap-2">
        {LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition hover:bg-[#F8FAFC]"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${link.cls}`}
            >
              <FontAwesomeIcon icon={link.icon} className="h-3.5 w-3.5" />
            </span>
            <span className="text-center text-[10px] font-semibold text-[#1C2B4A]">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
