import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faCalendarCheck,
  faChartLine,
  faClock,
  faHospital,
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../ui/Logo";

const navItems = [
  {
    label: "Tableau de bord",
    path: "/pharmacien/dashboard",
    icon: faChartLine,
  },
  {
    label: "Profil pharmacie",
    path: "/pharmacien/pharmacie",
    icon: faHospital,
  },
  {
    label: "Horaires",
    path: "/pharmacien/horaires",
    icon: faClock,
  },
  {
    label: "Stocks",
    path: "/pharmacien/stocks",
    icon: faBoxesStacked,
  },
  {
    label: "Réservations",
    path: "/pharmacien/reservations",
    icon: faCalendarCheck,
  },
];

function PharmacienNavLink({ item, mobile = false }) {
  return (
    <NavLink
      to={item.path}
      aria-label={item.label}
      className={({ isActive }) =>
        mobile
          ? `group flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition duration-300 ${
              isActive
                ? "bg-gradient-to-br from-[#2F6E9E] to-[#35C3A3] text-white shadow-[0_12px_26px_rgba(47,110,158,0.22)]"
                : "text-[#2F6E9E] hover:bg-[#2F6E9E]/8"
            }`
          : `group relative flex h-12 w-12 items-center justify-center rounded-2xl transition duration-300 ${
              isActive
                ? "bg-gradient-to-br from-[#2F6E9E] via-[#0085AA] to-[#35C3A3] text-white shadow-[0_16px_34px_rgba(47,110,158,0.26)]"
                : "text-[#2F6E9E] hover:-translate-y-0.5 hover:bg-[#2F6E9E]/10 hover:text-[#0085AA]"
            }`
      }
    >
      <FontAwesomeIcon icon={item.icon} className={mobile ? "h-4 w-4" : "h-5 w-5"} />
      {mobile ? (
        <span className="truncate">{item.label.split(" ")[0]}</span>
      ) : (
        <span className="pointer-events-none absolute left-[4.25rem] z-50 scale-95 whitespace-nowrap rounded-xl bg-[#1F2937] px-3 py-2 text-xs font-black text-white opacity-0 shadow-xl transition duration-200 group-hover:scale-100 group-hover:opacity-100">
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

function PharmacienSidebar() {
  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-20 border-r border-[#2F6E9E]/10 bg-white/95 px-3 py-5 shadow-[18px_0_60px_rgba(47,110,158,0.08)] backdrop-blur-xl lg:flex lg:flex-col lg:items-center">
        <Logo className="h-12" position="static" compact />

        <nav className="mt-10 flex flex-1 flex-col items-center gap-3">
          {navItems.map((item) => (
            <PharmacienNavLink key={item.path} item={item} />
          ))}
        </nav>

        <div className="mb-2 h-10 w-10 rounded-2xl bg-gradient-to-br from-[#2F6E9E]/10 to-[#35C3A3]/15" />
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2F6E9E]/10 bg-white/95 px-2 py-2 shadow-[0_-16px_40px_rgba(47,110,158,0.1)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <PharmacienNavLink key={item.path} item={item} mobile />
          ))}
        </div>
      </nav>
    </>
  );
}

export default PharmacienSidebar;
