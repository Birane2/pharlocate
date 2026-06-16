import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCalendarCheck,
  faCreditCard,
  faMapLocationDot,
  faPills,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../context/AuthContext";

const actions = [
  {
    title: "Trouver une pharmacie",
    text: "Recherche et carte.",
    to: "/pharmacies",
    icon: faMapLocationDot,
  },
  {
    title: "Mes reservations",
    text: "Suivi des commandes.",
    to: "/user/reservations",
    icon: faCalendarCheck,
  },
  {
    title: "Paiements",
    text: "Historique et preuves.",
    to: "/payments",
    icon: faCreditCard,
  },
  {
    title: "Notifications",
    text: "Alertes importantes.",
    to: "/notifications",
    icon: faBell,
  },
];

function UserDashboard() {
  const { user } = useAuth();
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.phone_number ||
    "Bienvenue";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1C2B4A]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[1.5rem] bg-[linear-gradient(135deg,#2F6E9E,#2FA6A3)] p-5 text-white shadow-lg shadow-[#2F6E9E]/15">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
            Espace utilisateur
          </p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            Bonjour {name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/80">
            Retrouvez rapidement vos pharmacies, reservations, paiements et alertes.
          </p>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2F6E9E]/10 text-[#2F6E9E]">
                <FontAwesomeIcon icon={action.icon} />
              </div>
              <h2 className="mt-4 text-base font-black text-[#1C2B4A]">
                {action.title}
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                {action.text}
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-5 rounded-2xl border border-[#E2E8F2] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2FA6A3]/10 text-[#2FA6A3]">
                <FontAwesomeIcon icon={faPills} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#1C2B4A]">
                  Besoin d'un medicament ?
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                  Lancez une recherche dans les pharmacies disponibles.
                </p>
              </div>
            </div>
            <Link
              to="/pharmacies"
              className="rounded-xl bg-[#2F6E9E] px-4 py-2 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#255C86]"
            >
              Rechercher
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;
