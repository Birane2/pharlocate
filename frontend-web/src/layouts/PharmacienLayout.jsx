import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faCalendarCheck,
  faChartLine,
  faClinicMedical,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";

const pharmacienNavigation = [
  {
    label: "Dashboard",
    shortLabel: "Dash",
    path: "/pharmacien/dashboard",
    icon: faChartLine,
  },
  {
    label: "Profil pharmacie",
    shortLabel: "Profil",
    path: "/pharmacien/pharmacie",
    icon: faClinicMedical,
  },
  {
    label: "Horaires",
    shortLabel: "Horaires",
    path: "/pharmacien/horaires",
    icon: faClock,
  },
  {
    label: "Stocks",
    shortLabel: "Stocks",
    path: "/pharmacien/stocks",
    icon: faBoxesStacked,
  },
  {
    label: "Réservations",
    shortLabel: "Réserv.",
    path: "/pharmacien/reservations",
    icon: faCalendarCheck,
  },
];

function MobilePharmacienNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2F6E9E]/10 bg-white/95 px-2 py-2 shadow-[0_-16px_40px_rgba(47,110,158,0.1)] backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {pharmacienNavigation.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            aria-label={link.label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition duration-300 ${
                isActive
                  ? "bg-gradient-to-br from-[#2F6E9E] to-[#35C3A3] text-white shadow-[0_12px_26px_rgba(47,110,158,0.22)]"
                  : "text-[#2F6E9E] hover:bg-[#2F6E9E]/8"
              }`
            }
          >
            <FontAwesomeIcon icon={link.icon} className="h-4 w-4" />
            <span className="truncate">{link.shortLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function PharmacienLayout({ title = "Espace pharmacien", children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#F8FBFD_0%,#FFFFFF_46%,#F0FAFA_100%)] text-pharmaText">
      <Sidebar
        links={pharmacienNavigation}
        title="Espace pharmacien"
        showLogout
        width="wide"
      />

      <main className="min-h-screen pb-24 lg:ml-64 lg:pb-0">
        <Header
          title={title}
          subtitle="Bienvenue, Pharmacien"
        />

        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </section>
      </main>

      <MobilePharmacienNav />
    </div>
  );
}

export default PharmacienLayout;
