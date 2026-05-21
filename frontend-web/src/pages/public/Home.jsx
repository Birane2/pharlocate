import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faClock,
  faLocationDot,
  faMapLocationDot,
  faPhone,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/layout/Navbar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getPharmacies } from "../../services/pharmacyService";

function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [featuredPharmacies, setFeaturedPharmacies] = useState([]);
  const [guardPharmacies, setGuardPharmacies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        setApiError("");

        const [popularResponse, guardResponse] = await Promise.all([
          getPharmacies(),
          getPharmacies({ est_garde: true }),
        ]);

        const popularPharmacies = Array.isArray(popularResponse)
          ? popularResponse
          : popularResponse?.results || popularResponse?.data || [];

        const gardePharmacies = Array.isArray(guardResponse)
          ? guardResponse
          : guardResponse?.results || guardResponse?.data || [];

        if (isMounted) {
          setFeaturedPharmacies(popularPharmacies.slice(0, 3));
          setGuardPharmacies(gardePharmacies.slice(0, 3));
        }
      } catch {
        if (isMounted) {
          setApiError(
            "Les pharmacies publiques sont momentanément indisponibles. Vous pouvez quand même lancer une recherche."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayPharmacies = useMemo(() => {
    const placeholders = [
      {
        id: "placeholder-1",
        nom: "Pharmacie Centrale",
        adresse: "Tevragh-Zeina, Nouakchott",
        telephone: "+222 45 25 00 00",
        latitude: "18.098",
        longitude: "-15.974",
      },
      {
        id: "placeholder-2",
        nom: "Pharmacie du Centre",
        adresse: "Ksar, Nouakchott",
        telephone: "+222 45 25 11 11",
        latitude: "18.091",
        longitude: "-15.963",
      },
      {
        id: "placeholder-3",
        nom: "Pharmacie Sahara",
        adresse: "Sebkha, Nouakchott",
        telephone: "+222 45 25 22 22",
        latitude: "18.085",
        longitude: "-15.989",
      },
    ];

    if (featuredPharmacies.length >= 3) {
      return featuredPharmacies.slice(0, 3);
    }

    return [...featuredPharmacies, ...placeholders].slice(0, 3);
  }, [featuredPharmacies]);

  const displayGuardPharmacies = useMemo(() => {
    if (guardPharmacies.length > 0) {
      return guardPharmacies;
    }

    return displayPharmacies.slice(0, 2);
  }, [guardPharmacies, displayPharmacies]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      navigate("/pharmacies");
      return;
    }

    navigate(`/pharmacies?search=${encodeURIComponent(trimmedSearch)}`);
  };

  const handleOpenMap = (pharmacy) => {
    if (!pharmacy?.latitude || !pharmacy?.longitude) {
      navigate("/map");
      return;
    }

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const renderPharmacyCards = (items) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map((pharmacy) => (
        <Card key={pharmacy.id} className="h-full">
          <div className="flex h-full flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F0FA] text-[#2F6E9E]">
                <FontAwesomeIcon icon={faStore} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0B1E3D]">
                  {pharmacy.nom}
                </h3>
                <p className="mt-1 text-sm text-[#6B7A99]">
                  {pharmacy.adresse}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-[#6B7A99]">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPhone} className="text-[#2FA6A3]" />
                <span>{pharmacy.telephone}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="text-[#2F6E9E]" />
                <span>
                  {pharmacy.latitude}, {pharmacy.longitude}
                </span>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/pharmacies/${pharmacy.id}`)}
              >
                Voir détails
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => handleOpenMap(pharmacy)}
              >
                Voir sur la carte
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F5FB] text-[#0B1E3D]">
      <Navbar />

      <main className="pb-10">
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full bg-[#E8F0FA] px-4 py-2 text-sm font-semibold text-[#2F6E9E]">
                Santé de proximité à Nouakchott
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#1C2B4A] sm:text-5xl">
                Trouvez rapidement une pharmacie fiable, ouverte et proche de vous.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6B7A99] sm:text-base">
                PharmaLocate vous aide à rechercher une pharmacie publique, à consulter les
                informations utiles, à repérer les gardes et à accéder plus vite à la
                carte interactive.
              </p>

              <form onSubmit={handleSearchSubmit} className="mt-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Nom, adresse ou téléphone d’une pharmacie"
                    className="flex-1"
                  />
                  <Button type="submit" variant="primary" className="sm:min-w-[148px]">
                    Rechercher
                  </Button>
                </div>
              </form>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => navigate("/pharmacies")}>
                  Voir les pharmacies
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/pharmacies?est_garde=true")}
                >
                  Voir les gardes
                </Button>
                <Button type="button" variant="ghost" onClick={() => navigate("/map")}>
                  Ouvrir la carte
                </Button>
              </div>
            </div>

            <Card hover={false} className="bg-white">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F7F3] text-[#2FA6A3]">
                    <FontAwesomeIcon icon={faMapLocationDot} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1C2B4A]">
                      Accès rapide
                    </h2>
                    <p className="mt-1 text-sm text-[#6B7A99]">
                      Une recherche simple pour gagner du temps.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                    <p className="font-medium text-[#1C2B4A]">Recherche pharmacie</p>
                    <p className="mt-1 text-sm text-[#6B7A99]">
                      Retrouvez une pharmacie par nom, adresse ou téléphone.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                    <p className="font-medium text-[#1C2B4A]">Pharmacies de garde</p>
                    <p className="mt-1 text-sm text-[#6B7A99]">
                      Consultez plus vite les options utiles en cas d’urgence.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F8FBFF] px-4 py-3">
                    <p className="font-medium text-[#1C2B4A]">Carte interactive</p>
                    <p className="mt-1 text-sm text-[#6B7A99]">
                      Localisez les établissements visibles autour de vous.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-4">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1C2B4A]">
                Pharmacies populaires
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#6B7A99]">
                Quelques pharmacies visibles pour commencer rapidement votre recherche.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              icon={faArrowRight}
              iconPosition="right"
              onClick={() => navigate("/pharmacies")}
            >
              Explorer la liste
            </Button>
          </div>

          {apiError ? (
            <Card hover={false}>
              <p className="text-sm leading-7 text-[#6B7A99]">{apiError}</p>
            </Card>
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Card key={item} hover={false}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-5 w-24 rounded-full bg-[#2F6E9E]/10" />
                    <div className="h-7 w-3/4 rounded-full bg-[#2F6E9E]/10" />
                    <div className="h-4 w-full rounded-full bg-[#2F6E9E]/10" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            renderPharmacyCards(displayPharmacies)
          )}
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1C2B4A]">
                Pharmacies de garde
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#6B7A99]">
                Une sélection utile pour les besoins urgents et les recherches prioritaires.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              icon={faClock}
              onClick={() => navigate("/pharmacies?est_garde=true")}
            >
              Voir toutes les gardes
            </Button>
          </div>

          {apiError ? (
            <Card hover={false}>
              <p className="text-sm leading-7 text-[#6B7A99]">{apiError}</p>
            </Card>
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2].map((item) => (
                <Card key={item} hover={false}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-5 w-24 rounded-full bg-[#2F6E9E]/10" />
                    <div className="h-7 w-3/4 rounded-full bg-[#2F6E9E]/10" />
                    <div className="h-4 w-full rounded-full bg-[#2F6E9E]/10" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            renderPharmacyCards(displayGuardPharmacies)
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;
