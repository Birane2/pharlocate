import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight,
  faBoxesStacked,
  faCalendarCheck,
  faClock,
  faPills,
} from "@fortawesome/free-solid-svg-icons";

function DashboardQuickActions({ loading, onRefresh }) {
  return (
    <section className="dashboard-reveal rounded-2xl border border-[#2F6E9E]/10 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <h2 className="shrink-0 text-sm font-bold text-[#1C2B4A]">Actions rapides</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/pharmacien/reservations"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F6E9E] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#255B84] hover:shadow-md sm:text-sm"
          >
            <FontAwesomeIcon icon={faCalendarCheck} />
            Voir les reservations
          </Link>
          <Link
            to="/pharmacien/stocks/ajouter"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F6E9E]/8 px-3 py-2 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E]/15"
          >
            <FontAwesomeIcon icon={faPills} />
            Ajouter medicament
          </Link>
          <Link
            to="/pharmacien/stocks/ajouter"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F6E9E]/8 px-3 py-2 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E]/15"
          >
            <FontAwesomeIcon icon={faBoxesStacked} />
            Ajouter stock
          </Link>
          <Link
            to="/pharmacien/horaires"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F6E9E]/8 px-3 py-2 text-xs font-bold text-[#2F6E9E] transition hover:bg-[#2F6E9E]/15"
          >
            <FontAwesomeIcon icon={faClock} />
            Gerer horaires
          </Link>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2FA6A3] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#248C8A] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:text-sm"
          >
            <FontAwesomeIcon
              icon={faArrowRotateRight}
              className={loading ? "animate-spin" : ""}
            />
            Actualiser
          </button>
        </div>
      </div>
    </section>
  );
}

export default DashboardQuickActions;
