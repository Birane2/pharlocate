import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faCalendarDays,
  faChevronDown,
  faDatabase,
  faMagnifyingGlass,
  faRightFromBracket,
  faRotateRight,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../notifications/NotificationBell";
import AdminSearchBar from "./AdminSearchBar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getPeriodLabel(startDate, endDate) {
  const today = new Date().toISOString().slice(0, 10);
  if (!startDate && !endDate) return "Toutes les données";
  if (startDate && endDate && startDate === endDate)
    return startDate === today ? "Aujourd'hui" : fmt(startDate);
  if (startDate && endDate) return `${fmt(startDate)} — ${fmt(endDate)}`;
  if (startDate) return `Depuis ${fmt(startDate)}`;
  return `Jusqu'au ${fmt(endDate)}`;
}

// ─── DateFilterDropdown ───────────────────────────────────────────────────────

function DateFilterDropdown({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onTodayClick,
  onAllDataClick,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const label = getPeriodLabel(startDate || "", endDate || "");

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-xs font-bold text-[#1C2B4A] transition hover:border-[#2F6E9E]/30 hover:bg-[#F8FAFC]"
      >
        <FontAwesomeIcon icon={faCalendarDays} className="h-3.5 w-3.5 text-[#2F6E9E]" />
        <span className="hidden max-w-[110px] truncate sm:inline">{label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`h-2.5 w-2.5 text-[#6B7280] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[240px] overflow-hidden rounded-xl border border-[#E2E8F2] bg-white shadow-xl">
          <p className="border-b border-[#F1F5F9] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">
            Filtrer par période
          </p>

          <div className="space-y-2 p-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-2">
              <span className="w-8 shrink-0 text-[10px] font-bold text-[#6B7280]">Début</span>
              <input
                type="date"
                value={startDate || ""}
                onChange={(e) => onStartDateChange?.(e.target.value)}
                className="flex-1 bg-transparent text-xs font-semibold text-[#1C2B4A] outline-none"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-2">
              <span className="w-8 shrink-0 text-[10px] font-bold text-[#6B7280]">Fin</span>
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                className="flex-1 bg-transparent text-xs font-semibold text-[#1C2B4A] outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-[#F1F5F9] p-3">
            <button
              type="button"
              onClick={() => {
                onTodayClick?.();
                setOpen(false);
              }}
              className="rounded-xl bg-[#2F6E9E] py-2 text-[11px] font-bold text-white transition hover:bg-[#255C84]"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => {
                onAllDataClick?.();
                setOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] py-2 text-[11px] font-bold text-[#6B7280] transition hover:bg-[#F8FAFC]"
            >
              <FontAwesomeIcon icon={faDatabase} className="h-3 w-3" />
              Tout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProfileDropdown ──────────────────────────────────────────────────────────

function ProfileDropdown({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const displayName = fullName || user?.phone_number || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = user?.email || user?.role || "Compte";

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-[#F8FAFC]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F6E9E] to-[#2FA6A3] text-xs font-bold text-white shadow-sm">
          {initials}
        </span>
        <span className="hidden sm:block">
          <span className="block max-w-24 truncate text-xs font-bold text-[#1C2B4A]">
            {displayName}
          </span>
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`hidden h-2.5 w-2.5 text-[#6B7280] transition sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-[#E2E8F2] bg-white shadow-xl"
          role="menu"
        >
          {/* Identity */}
          <div className="border-b border-[#F1F5F9] px-3 py-3">
            <p className="truncate text-xs font-bold text-[#1C2B4A]">{displayName}</p>
            <p className="truncate text-[10px] font-medium text-[#6B7280]">{email}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              to="/admin/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
              role="menuitem"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#2F6E9E]/10 text-[#2F6E9E]">
                <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
              </span>
              Mon profil
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-[#F1F5F9] py-1">
            <button
              type="button"
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
              role="menuitem"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <FontAwesomeIcon icon={faRightFromBracket} className="h-3 w-3" />
              </span>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AdminHeader ──────────────────────────────────────────────────────────────

function AdminHeader({
  title = "Administration",
  subtitle,
  showDateFilter = false,
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  onTodayClick,
  onAllDataClick,
  onResetClick,
  actionLoading = false,
  notificationsPath = "/admin/notifications",
  onMenuClick,
}) {
  const { user, logout } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-[#E5E7EB] bg-white px-4 shadow-sm sm:px-6">
      {/* ── Left ── */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#6B7280] transition hover:bg-[#F8FAFC] hover:text-[#2F6E9E]"
          aria-label="Basculer le menu"
        >
          <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
        </button>

        <div className="hidden min-w-0 sm:block">
          <h1 className="truncate text-sm font-bold text-[#1C2B4A]">{title}</h1>
          {subtitle && (
            <p className="truncate text-[10px] font-medium text-[#6B7280]">{subtitle}</p>
          )}
        </div>
      </div>

      {/* ── Center: search bar (large screens) ── */}
      <div className="mx-4 hidden flex-1 xl:block" style={{ maxWidth: 480 }}>
        <AdminSearchBar />
      </div>

      {/* ── Right: actions ── */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Mobile search icon */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7280] transition hover:bg-[#F8FAFC] hover:text-[#2F6E9E] xl:hidden"
          aria-label="Rechercher"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
        </button>

        {/* Date filter dropdown (dashboard only) */}
        {showDateFilter && (
          <DateFilterDropdown
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            onTodayClick={onTodayClick}
            onAllDataClick={onAllDataClick}
          />
        )}

        {/* Refresh button (dashboard only) */}
        {showDateFilter && (
          <button
            type="button"
            onClick={onResetClick}
            disabled={actionLoading}
            title="Actualiser"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#2FA6A3] transition hover:border-[#2FA6A3]/30 hover:bg-[#2FA6A3]/8 disabled:opacity-60"
          >
            <FontAwesomeIcon
              icon={faRotateRight}
              className={`h-3.5 w-3.5 ${actionLoading ? "animate-spin" : ""}`}
            />
          </button>
        )}

        {/* Notifications */}
        <NotificationBell notificationsPath={notificationsPath} />

        {/* Avatar + profile dropdown */}
        <ProfileDropdown user={user} logout={logout} />
      </div>

      {/* ── Mobile full-screen search overlay ── */}
      {mobileSearchOpen && (
        <div className="absolute inset-0 z-50 flex items-center bg-white px-4 shadow-sm">
          <AdminSearchBar
            className="flex-1"
            onClose={() => setMobileSearchOpen(false)}
          />
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#6B7280] transition hover:bg-[#F8FAFC]"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}

export default AdminHeader;
