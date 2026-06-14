import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faBoxesStacked,
  faCalendarCheck,
  faChartLine,
  faChevronLeft,
  faChevronRight,
  faClinicMedical,
  faClock,
  faHospital,
  faSignOutAlt,
  faUserShield,
  faUsers,
  faXmark,
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
  admin: "w-[230px]",
};

function getLinkIcon(link) {
  if (link.icon) {
    return link.icon;
  }

  const signature = `${link.label || ""} ${link.path || ""}`.toLowerCase();
  return fallbackIcons.find((item) => signature.includes(item.match))?.icon || faHospital;
}

function SidebarContent({
  links,
  title,
  showLogout,
  showUserFooter,
  collapsed,
  collapsible,
  onCollapsedChange,
  onNavigate,
}) {
  const { user, logout } = useAuth();
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const isAdmin = user?.role === "admin";
  const displayName = isAdmin
    ? "Admin PharmaLocate"
    : fullName || user?.phone_number || "Administrateur";
  const avatarLabel = isAdmin ? "AM" : displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <div
        className="flex h-[72px] items-center justify-center border-b border-[#E5E7EB] px-3"
      >
        <Logo
          className={collapsed ? "h-8" : "h-9"}
          imageClassName="drop-shadow-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p
            className="mb-4 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]"
          >
            {title}
          </p>
        )}

        <nav className="space-y-1.5">
          {links.map((link) => {
            const icon = getLinkIcon(link);

            return (
              <NavLink
                key={link.path}
                to={link.path}
                title={collapsed ? link.label : undefined}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group flex h-11 items-center rounded-2xl text-sm font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2FA6A3]/15 ${
                    collapsed ? "justify-center px-0" : "gap-2.5 px-3"
                  } ${
                    isActive
                      ? "bg-gradient-to-r from-[#2F6E9E] to-[#1F66D1] text-white shadow-[0_10px_24px_rgba(47,110,158,0.24)]"
                      : "text-[#1C2B4A] hover:-translate-y-0.5 hover:bg-[#F8FAFC]"
                  }`
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-current/8 transition group-hover:scale-105">
                  <FontAwesomeIcon icon={icon} className="h-4.5 w-4.5" />
                </span>
                {!collapsed && <span className="truncate">{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {showUserFooter && (
        <div
          className="border-t border-[#E5E7EB] bg-white p-4"
        >
          <div
            className={`relative flex items-center rounded-2xl border border-[#E2E8F2] bg-white shadow-sm ${
              collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2.5"
            }`}
            title={collapsed ? `${displayName} - Administrateur` : undefined}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F6E9E] to-[#2FA6A3] text-xs font-black text-white">
              {avatarLabel}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1C2B4A]">
                  {displayName}
                </p>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#2F6E9E]/10 px-2 py-0.5 text-[10px] font-bold text-[#2F6E9E]">
                  <FontAwesomeIcon icon={faUserShield} className="h-2.5 w-2.5" />
                  Administrateur
                </span>
              </div>
            )}
            {!collapsed && (
              <span className="absolute bottom-4 right-3 h-2 w-2 rounded-full bg-[#22C55E]" />
            )}
          </div>
        </div>
      )}

      {showLogout && (
        <div className="border-t border-[#E5E7EB] bg-white p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#2F6E9E] transition hover:bg-red-50 hover:text-red-600"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4" />
            {!collapsed && <span>Deconnexion</span>}
          </button>
        </div>
      )}

      {collapsible && (
        <button
          type="button"
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="absolute -right-3 top-20 hidden h-7 w-7 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#2F6E9E] shadow-sm transition hover:bg-[#2F6E9E] hover:text-white lg:flex"
          aria-label={collapsed ? "Ouvrir la sidebar" : "Reduire la sidebar"}
        >
          <FontAwesomeIcon
            icon={collapsed ? faChevronRight : faChevronLeft}
            className="h-3 w-3"
          />
        </button>
      )}
    </>
  );
}

function Sidebar({
  links = [],
  title = "Navigation",
  showLogout = false,
  showUserFooter = false,
  width = "compact",
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const expandedWidth = widthClasses[width] || widthClasses.compact;

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#2F6E9E] shadow-sm lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
      </button>

      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen border-r border-[#E5E7EB] bg-white shadow-[18px_0_60px_rgba(47,110,158,0.07)] transition-all duration-300 lg:flex lg:flex-col ${
          collapsed ? "w-[72px]" : expandedWidth
        }`}
      >
        <SidebarContent
          links={links}
          title={title}
          showLogout={showLogout}
          showUserFooter={showUserFooter}
          collapsed={collapsed}
          collapsible={collapsible}
          onCollapsedChange={onCollapsedChange}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#1C2B4A]/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          />
          <aside
            className="relative flex h-full w-[230px] flex-col border-r border-[#E5E7EB] bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#1C2B4A]"
              aria-label="Fermer"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <SidebarContent
              links={links}
              title={title}
              showLogout={showLogout}
              showUserFooter={showUserFooter}
              collapsed={false}
              collapsible={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}

export default Sidebar;
