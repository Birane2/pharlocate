import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBoxesStacked,
  faCalendarCheck,
  faChartLine,
  faClinicMedical,
  faClock,
  faHospital,
  faSignOutAlt,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../ui/Logo";

const fallbackIcons = [
  { match: "dashboard", icon: faChartLine },
  { match: "tableau", icon: faChartLine },
  { match: "profil", icon: faClinicMedical },
  { match: "pharmacie", icon: faClinicMedical },
  { match: "horaire", icon: faClock },
  { match: "stock", icon: faBoxesStacked },
  { match: "reservation", icon: faCalendarCheck },
  { match: "notification", icon: faBell },
  { match: "utilisateur", icon: faUsers },
];

const widthClasses = {
  compact: "w-56",
  wide: "w-64",
};

function getLinkIcon(link) {
  if (link.icon) {
    return link.icon;
  }

  const signature = `${link.label || ""} ${link.path || ""}`.toLowerCase();
  return fallbackIcons.find((item) => signature.includes(item.match))?.icon || faHospital;
}

function Sidebar({
  links = [],
  title = "Navigation",
  showLogout = false,
  width = "compact",
}) {
  const { logout } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen border-r border-[#2F6E9E]/10 bg-white/95 shadow-[18px_0_60px_rgba(47,110,158,0.07)] backdrop-blur-xl lg:flex lg:flex-col ${widthClasses[width] || widthClasses.compact}`}
    >
      <div className="flex h-20 items-center justify-center border-b border-[#2F6E9E]/10 px-5">
        <Logo className="h-11" imageClassName="drop-shadow-sm" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0085AA]/70">
          {title}
        </p>

        <nav className="space-y-2">
          {links.map((link) => {
            const icon = getLinkIcon(link);

            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold leading-5 transition duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#2F6E9E] via-[#0085AA] to-[#35C3A3] text-white shadow-[0_14px_30px_rgba(47,110,158,0.2)]"
                      : "text-[#2F6E9E] hover:-translate-y-0.5 hover:bg-[#2F6E9E]/8 hover:text-[#0085AA]"
                  }`
                }
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-current/10 transition group-hover:scale-105">
                  <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                </span>
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {showLogout && (
        <div className="sticky bottom-0 border-t border-[#2F6E9E]/10 bg-white/95 p-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold leading-5 text-[#2F6E9E] transition duration-300 hover:bg-red-50 hover:text-red-600"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2F6E9E]/10 ring-1 ring-[#2F6E9E]/10">
              <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4" />
            </span>
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
