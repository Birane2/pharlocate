import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faEnvelope,
  faPhone,
  faShieldHalved,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import ProfileAvatar from "./ProfileAvatar";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] px-3 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-[#1C2B4A]">{value || "-"}</p>
      </div>
    </div>
  );
}

function ProfileInfoCard({ profile }) {
  const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
    || "Administrateur";

  return (
    <section className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          firstName={profile?.first_name}
          lastName={profile?.last_name}
          email={profile?.email}
        />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-black text-[#1C2B4A]">{fullName}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2F6E9E]/10 px-3 py-1 text-xs font-black text-[#2F6E9E]">
              <FontAwesomeIcon icon={faShieldHalved} />
              Admin
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2FA6A3]/10 px-3 py-1 text-xs font-black text-[#167769]">
              <FontAwesomeIcon icon={faUserCheck} />
              {profile?.is_active ? "Actif" : "Suspendu"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <InfoRow icon={faEnvelope} label="E-mail" value={profile?.email} />
        <InfoRow icon={faPhone} label="Téléphone" value={profile?.phone_number} />
        <InfoRow icon={faShieldHalved} label="Rôle" value={profile?.role} />
        <InfoRow
          icon={faCalendarDays}
          label="Créé le"
          value={formatDate(profile?.date_joined || profile?.date_creation)}
        />
      </div>
    </section>
  );
}

export default ProfileInfoCard;
