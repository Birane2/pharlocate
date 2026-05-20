import { NavLink } from "react-router-dom";

function MobileNav({ links = [] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-pharmaBorder bg-white px-2 py-2 lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {links.slice(0, 4).map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `rounded-xl px-2 py-2 text-center text-xs font-semibold transition ${
                isActive
                  ? "bg-pharmaTurquoise text-white"
                  : "text-pharmaText hover:bg-pharmaBg"
              }`
            }
          >
            {link.shortLabel || link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileNav;