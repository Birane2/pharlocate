import { useAuth } from "../../context/AuthContext";
import Logo from "../ui/Logo";

function Header({
  title = "Administration",
  subtitle,
  showLogo = false,
  logoTo = "/",
  showSubtitle = true,
}) {
  const { user } = useAuth();
  const displayName = user?.role === "pharmacien" ? "Pharmacien" : user?.username || "Admin";

  return (
    <header className="sticky top-0 z-50 border-b border-[#2F6E9E]/10 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(47,110,158,0.08)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {showLogo && (
            <Logo
              to={logoTo}
              className="h-9"
              imageClassName="drop-shadow-sm"
            />
          )}

          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-[#2F6E9E]">
              {title}
            </h1>
            {showSubtitle && (
              <p className="mt-1 truncate text-sm font-normal leading-5 text-[#6B7280]">
                {subtitle || `Bienvenue, ${displayName}`}
              </p>
            )}
          </div>
        </div>

        <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#2F6E9E]/10 to-[#35C3A3]/15" />
      </div>
    </header>
  );
}

export default Header;
