import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBell,
  faBoxesStacked,
  faCartShopping,
  faChevronDown,
  faCreditCard,
  faHospital,
  faLocationDot,
  faMapLocationDot,
  faPills,
  faQuoteLeft,
  faShieldHeart,
  faStar,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/layout/Navbar";
import { getPharmacies } from "../../services/pharmacyService";

const features = [
  {
    title: "Geolocalisation",
    text: "Trouvez les pharmacies proches.",
    icon: faLocationDot,
    tone: "bg-[#2F6E9E]/10 text-[#2F6E9E]",
  },
  {
    title: "Medicaments",
    text: "Recherchez les disponibilites.",
    icon: faPills,
    tone: "bg-[#2FA6A3]/10 text-[#2FA6A3]",
  },
  {
    title: "Stocks",
    text: "Consultez les stocks visibles.",
    icon: faBoxesStacked,
    tone: "bg-[#5EC6B8]/15 text-[#2FA6A3]",
  },
  {
    title: "Reservation",
    text: "Reservez en quelques clics.",
    icon: faCartShopping,
    tone: "bg-[#4A8BBE]/10 text-[#4A8BBE]",
  },
  {
    title: "Livraison",
    text: "Choisissez le retrait ou la livraison.",
    icon: faTruckFast,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Notifications",
    text: "Suivez les mises a jour utiles.",
    icon: faBell,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Paiement mobile",
    text: "Payez simplement et gardez une trace.",
    icon: faCreditCard,
    tone: "bg-cyan-50 text-cyan-700",
  },
  {
    title: "Gardes",
    text: "Identifiez les pharmacies de garde.",
    icon: faHospital,
    tone: "bg-red-50 text-red-600",
  },
];

const steps = [
  "Recherchez un medicament",
  "Choisissez une pharmacie",
  "Reservez votre commande",
  "Payez ou choisissez le retrait",
  "Recevez vos medicaments",
];

const pharmacistBenefits = [
  "Visibilite accrue",
  "Gestion des stocks",
  "Reception des commandes",
  "Paiements simplifies",
  "Statistiques utiles",
  "Gestion des livraisons",
];

const testimonials = [
  {
    name: "Aminata D.",
    role: "Utilisatrice",
    quote:
      "J'ai trouve une pharmacie ouverte et reserve mes medicaments sans appeler partout.",
  },
  {
    name: "Ph. El Menar",
    role: "Pharmacien",
    quote:
      "PharmaLocate rend les commandes plus claires et nous aide a mieux suivre nos stocks.",
  },
  {
    name: "Moussa B.",
    role: "Utilisateur",
    quote:
      "La carte et les informations de garde font gagner beaucoup de temps en urgence.",
  },
];

const faqs = [
  {
    question: "Comment trouver une pharmacie ?",
    answer:
      "Lancez une recherche ou ouvrez la carte pour voir les pharmacies disponibles autour de vous.",
  },
  {
    question: "Comment reserver ?",
    answer:
      "Selectionnez une pharmacie, consultez les medicaments disponibles, puis envoyez votre reservation.",
  },
  {
    question: "Comment fonctionne la livraison ?",
    answer:
      "Si la pharmacie propose la livraison, vous renseignez votre adresse et suivez le statut de la commande.",
  },
  {
    question: "Comment payer ?",
    answer:
      "Les paiements mobiles disponibles sont affiches avant validation de la commande.",
  },
];

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl border border-[#2F6E9E]/10 bg-white/80 p-3 shadow-sm backdrop-blur">
      <p className="text-2xl font-black text-[#1C2B4A]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[#6B7280]">{label}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#2FA6A3]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-[#1C2B4A] md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm font-semibold leading-6 text-[#6B7280] md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState([]);
  const [guardCount, setGuardCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getPharmacies().catch(() => []),
      getPharmacies({ est_garde: true }).catch(() => []),
    ])
      .then(([allResponse, guardResponse]) => {
        if (ignore) {
          return;
        }

        const all = Array.isArray(allResponse)
          ? allResponse
          : allResponse?.results || allResponse?.data || [];
        const guards = Array.isArray(guardResponse)
          ? guardResponse
          : guardResponse?.results || guardResponse?.data || [];

        setPharmacies(all);
        setGuardCount(guards.length);
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => {
    const pharmacyCount = pharmacies.length || 25;
    const guardPharmacies = guardCount || Math.max(3, Math.round(pharmacyCount * 0.18));

    return [
      { value: `${pharmacyCount}+`, label: "Pharmacies inscrites" },
      { value: "1 200+", label: "Medicaments suivis" },
      { value: "850+", label: "Reservations effectuees" },
      { value: `${guardPharmacies}+`, label: "Pharmacies de garde" },
    ];
  }, [guardCount, pharmacies.length]);

  const featuredPharmacies = useMemo(() => {
    const fallback = [
      { id: "demo-1", nom: "Pharmacie Centrale", adresse: "Tevragh Zeina" },
      { id: "demo-2", nom: "Pharmacie El Menar", adresse: "Nouakchott" },
      { id: "demo-3", nom: "Pharmacie Sahara", adresse: "Ksar" },
    ];

    return (pharmacies.length ? pharmacies : fallback).slice(0, 3);
  }, [pharmacies]);

  return (
    <div className="min-h-screen scroll-smooth bg-[#F8FAFC] text-[#1C2B4A]">
      <Navbar />

      <main>
        <section
          id="home"
          className="relative overflow-hidden border-b border-[#2F6E9E]/10 bg-[radial-gradient(circle_at_top_left,#DDF7F2_0%,transparent_34%),linear-gradient(135deg,#F8FAFC_0%,#FFFFFF_48%,#EAF6FB_100%)]"
        >
          <div className="absolute right-[-120px] top-24 h-72 w-72 rounded-full bg-[#2FA6A3]/10 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] h-80 w-80 rounded-full bg-[#2F6E9E]/10 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.03fr_0.97fr] lg:py-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2FA6A3]/20 bg-white/80 px-4 py-2 text-sm font-black text-[#2F6E9E] shadow-sm backdrop-blur">
                <FontAwesomeIcon icon={faShieldHeart} className="text-[#2FA6A3]" />
                HealthTech pharmaceutique en Mauritanie
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-black leading-[1.05] tracking-tight text-[#1C2B4A] sm:text-5xl lg:text-[3.4rem]">
                Trouvez vos medicaments rapidement avec PharmaLocate
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#6B7280] sm:text-base">
                Localisez les pharmacies proches, consultez les stocks disponibles,
                reservez vos medicaments et choisissez le retrait ou la livraison.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/pharmacies")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2F6E9E] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#2F6E9E]/20 transition hover:-translate-y-0.5 hover:bg-[#255C86]"
                >
                  Trouver une pharmacie
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#D8E3EE] bg-white px-5 py-3 text-sm font-black text-[#2F6E9E] shadow-sm transition hover:-translate-y-0.5 hover:border-[#2F6E9E]"
                >
                  Creer un compte
                </Link>
              </div>

              <div className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((item) => (
                  <StatCard key={item.label} value={item.value} label={item.label} />
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-2xl shadow-[#2F6E9E]/12 backdrop-blur-xl">
                <div className="rounded-[1.5rem] bg-[#1C2B4A] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white/60">Carte PharmaLocate</p>
                      <h2 className="mt-1 text-lg font-black">Pharmacies proches</h2>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5EC6B8] text-[#1C2B4A]">
                      <FontAwesomeIcon icon={faMapLocationDot} />
                    </div>
                  </div>

                  <div className="relative mt-4 h-52 overflow-hidden rounded-[1.25rem] bg-[linear-gradient(135deg,#E9F5FA,#D7F4EF)]">
                    <div className="absolute left-8 top-9 h-28 w-28 rounded-full border-8 border-white/60" />
                    <div className="absolute bottom-7 right-9 h-36 w-36 rounded-full border-8 border-[#2F6E9E]/20" />
                    <div className="absolute left-10 right-10 top-1/2 h-2 -rotate-12 rounded-full bg-white/80" />
                    <div className="absolute bottom-14 left-1/2 h-2 w-56 -translate-x-1/2 rotate-12 rounded-full bg-white/80" />

                    {[
                      "left-[18%] top-[28%]",
                      "right-[20%] top-[22%]",
                      "left-[42%] bottom-[22%]",
                    ].map((position, index) => (
                      <div
                        key={position}
                        className={`absolute ${position} flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2F6E9E] shadow-xl`}
                      >
                        <FontAwesomeIcon icon={index === 1 ? faPills : faHospital} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3">
                    {featuredPharmacies.map((pharmacy, index) => (
                      <div
                        key={pharmacy.id}
                        className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2F6E9E]">
                            <FontAwesomeIcon icon={faHospital} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">{pharmacy.nom}</p>
                            <p className="truncate text-xs font-semibold text-white/60">
                              {pharmacy.adresse || "Nouakchott"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#5EC6B8]/20 px-2.5 py-1 text-xs font-black text-[#5EC6B8]">
                          {index + 1}.{index + 8} km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
          <SectionHeader
            eyebrow="Fonctionnalites"
            title="Tout le parcours pharmacie dans une seule plateforme"
            subtitle="Une experience simple pour les patients, utile pour les pharmaciens, et claire pour les partenaires."
          />

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#2F6E9E]/8"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tone}`}>
                  <FontAwesomeIcon icon={feature.icon} />
                </div>
                <h3 className="mt-4 text-base font-black text-[#1C2B4A]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#6B7280]">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-y border-[#2F6E9E]/10 bg-white"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
            <SectionHeader
              eyebrow="Parcours"
              title="Comment ca marche ?"
              subtitle="Un flux court, lisible et adapte aux besoins reels des patients."
            />

            <div className="mt-8 grid gap-3 md:grid-cols-5">
              {steps.map((step, index) => (
                <div key={step} className="relative rounded-2xl border border-[#E2E8F2] bg-[#F8FAFC] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6E9E] text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <p className="mt-4 text-sm font-black leading-6 text-[#1C2B4A]">
                    {step}
                  </p>
                  {index < steps.length - 1 && (
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-[#2FA6A3] md:block"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pharmacists" className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-[1.5rem] bg-[#2F6E9E] p-6 text-white shadow-2xl shadow-[#2F6E9E]/20">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#5EC6B8]">
              Espace pharmacien
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Developpez votre pharmacie avec PharmaLocate
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-white/75">
              Centralisez vos stocks, commandes, paiements et livraisons dans un
              dashboard pense pour le terrain.
            </p>
            <Link
              to="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#2F6E9E] shadow-sm transition hover:-translate-y-0.5"
            >
              Rejoindre PharmaLocate
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pharmacistBenefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3 rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2FA6A3]/10 text-[#2FA6A3]">
                  <FontAwesomeIcon icon={faStar} />
                </div>
                <p className="text-sm font-black text-[#1C2B4A]">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-[#2F6E9E]/10 bg-[#F0FAFA]">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((item) => (
                <StatCard key={`bottom-${item.label}`} value={item.value} label={item.label} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
          <SectionHeader
            eyebrow="Temoignages"
            title="Une experience pensee pour les patients et pharmacies"
          />
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-3xl border border-[#E2E8F2] bg-white p-5 shadow-sm">
                <FontAwesomeIcon icon={faQuoteLeft} className="text-xl text-[#2FA6A3]" />
                <p className="mt-4 text-sm font-semibold leading-7 text-[#1C2B4A]">
                  {item.quote}
                </p>
                <div className="mt-5 border-t border-[#E2E8F2] pt-4">
                  <p className="font-black text-[#1C2B4A]">{item.name}</p>
                  <p className="text-sm font-semibold text-[#6B7280]">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white" id="contact">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeader
              eyebrow="FAQ"
              title="Questions frequentes"
              subtitle="Les reponses essentielles avant de commencer."
            />

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-[#E2E8F2] bg-[#F8FAFC] p-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-[#1C2B4A]">
                    {faq.question}
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="text-[#2F6E9E] transition group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#6B7280]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#2F6E9E,#2FA6A3)] p-8 text-center text-white shadow-2xl shadow-[#2F6E9E]/20">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              Commencez des aujourd'hui avec PharmaLocate
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/80 md:text-base">
              Recherchez, reservez, payez et suivez vos commandes de medicaments
              depuis une plateforme claire et professionnelle.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#2F6E9E] shadow-sm"
              >
                Creer un compte
              </Link>
              <Link
                to="/pharmacies"
                className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/15"
              >
                Trouver une pharmacie
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#2F6E9E]/10 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xl font-black text-[#1C2B4A]">PharmaLocate</p>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-[#6B7280]">
              Plateforme de geolocalisation pharmaceutique pour rapprocher
              patients, pharmacies, stocks et services de livraison.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {["Accueil", "Fonctionnalites", "Contact", "Conditions d'utilisation", "Confidentialite"].map(
              (item) => (
                <a
                  key={item}
                  href={item === "Accueil" ? "#home" : "#contact"}
                  className="text-sm font-bold text-[#6B7280] transition hover:text-[#2F6E9E]"
                >
                  {item}
                </a>
              )
            )}
          </div>
        </div>
        <div className="border-t border-[#2F6E9E]/10 px-4 py-4 text-center text-xs font-bold text-[#6B7280]">
          © 2026 PharmaLocate. Tous droits reserves.
          {loading ? " Chargement des donnees publiques..." : ""}
        </div>
      </footer>
    </div>
  );
}

export default Home;
