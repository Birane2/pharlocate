import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faCalendarCheck,
  faChartLine,
  faClock,
  faCreditCard,
  faFileInvoice,
  faHospital,
  faMoneyBillTrendUp,
  faReceipt,
  faStar,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../ui/Logo";

const navItems = [
  { label: "Dashboard", path: "/pharmacien/dashboard", icon: faChartLine },
  { label: "Profil pharmacie", path: "/pharmacien/pharmacie", icon: faHospital },
  { label: "Horaires", path: "/pharmacien/horaires", icon: faClock },
  { label: "Stocks", path: "/pharmacien/stocks", icon: faBoxesStacked },
  { label: "Réservations", path: "/pharmacien/reservations", icon: faCalendarCheck },
  { label: "Finance", path: "/pharmacien/finance", icon: faMoneyBillTrendUp },
  { label: "Paiements", path: "/pharmacien/payments", icon: faCreditCard },
  { label: "Modes de paiement", path: "/pharmacien/payment-methods", icon: faCreditCard },
  { label: "Livraisons", path: "/pharmacien/deliveries", icon: faTruckFast },
  { label: "Transactions", path: "/pharmacien/transactions", icon: faReceipt },
  { label: "Abonnement", path: "/pharmacien/subscription", icon: faFileInvoice },
  { label: "Avis", path: "/pharmacien/avis", icon: faStar },
];

function PharmacienNavLink({ item, mobile = false }) {
  return (
    <NavLink
      to={item.path}
      aria-label={item.label}
      className={({ isActive }) =>
        mobile
          ? `group flex min-w-[76px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold transition duration-200 ${
              isActive
                ? "bg-[#2F6E9E] text-white shadow-sm"
                : "text-[#2F6E9E] hover:bg-[#2F6E9E]/8"
            }`
          : `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition duration-200 ${
              isActive
                ? "bg-[#2F6E9E] text-white shadow-sm"
                : "text-[#2F6E9E] hover:bg-[#2F6E9E]/8 hover:text-[#245A82]"
            }`
      }
    >
      <FontAwesomeIcon icon={item.icon} className={mobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span className="truncate">{mobile ? item.label.split(" ")[0] : item.label}</span>
    </NavLink>
  );
}

function PharmacienSidebar() {
  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-52 border-r border-[#2F6E9E]/10 bg-white/95 px-3 py-5 shadow-[18px_0_60px_rgba(47,110,158,0.08)] backdrop-blur-xl lg:flex lg:flex-col">
        <Logo className="h-12" position="static" compact />

        <nav className="mt-8 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => (
            <PharmacienNavLink key={item.path} item={item} />
          ))}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2F6E9E]/10 bg-white/95 px-2 py-2 shadow-[0_-16px_40px_rgba(47,110,158,0.1)] backdrop-blur-xl lg:hidden">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <PharmacienNavLink key={item.path} item={item} mobile />
          ))}
        </div>
      </nav>
    </>
  );
}

export default PharmacienSidebar;
