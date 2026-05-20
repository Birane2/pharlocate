import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMagnifyingGlass,
  faPhone,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Logo from "../../components/ui/Logo";
import { getPharmacies } from "../../services/pharmacyService";

function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [featuredPharmacies, setFeaturedPharmacies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedPharmacies = async () => {
      try {
        setIsLoading(true);
        setApiError("");
        const response = await getPharmacies();
        const pharmacies = Array.isArray(response)
          ? response
          : response?.results || response?.data || [];

        if (isMounted) {
          setFeaturedPharmacies(pharmacies.slice(0, 3));
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

    loadFeaturedPharmacies();

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
      navigate("/pharmacies");
      return;
    }

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F5FB] text-[#0B1E3D]">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="h-14 sm:h-16" to="/" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => navigate("/login")}>
              Se connecter
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/pharmacien/pharmacie")}>
              Ma pharmacie
            </Button>
          </div>
        </div>

        <section className="mt-8">
          <Card hover={false} className="bg-white">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#0B1E3D] sm:text-4xl">
                  Trouvez rapidement une pharmacie fiable à Nouakchott.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6B7A99] sm:text-base">
                  PharmaLocate vous aide à rechercher une pharmacie publique, à consulter les informations utiles et à accéder plus vite aux pharmacies de garde.
                </p>

                <form onSubmit={handleSearchSubmit} className="mt-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Nom, adresse ou téléphone d’une pharmacie"
                      className="flex-1"
                    />
                    <Button type="submit" variant="primary" icon={faMagnifyingGlass}>
                      Rechercher
                    </Button>
                  </div>
                </form>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2E8F2] bg-[#F8FBFF] p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0B1E3D]">
                  Accès rapide
                </h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="font-medium text-[#0B1E3D]">Recherche simple</p>
                    <p className="mt-1 text-sm text-[#6B7A99]">
                      Trouvez une pharmacie par nom, adresse ou téléphone.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="font-medium text-[#0B1E3D]">Pharmacies validées</p>
                    <p className="mt-1 text-sm text-[#6B7A99]">
                      Les résultats publics affichent uniquement les pharmacies visibles.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="font-medium text-[#0B1E3D]">Pharmacies de garde</p>
                    <p className="mt-1 text-sm text-[#6B7A99]">
                      Accédez plus vite aux options utiles en cas de besoin urgent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-[#0B1E3D]">
              Pharmacies populaires
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#6B7A99]">
              Quelques pharmacies visibles pour commencer rapidement votre recherche.
            </p>
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {displayPharmacies.map((pharmacy) => (
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
                        onClick={() => handleOpenMap(pharmacy)}
                      >
                        Voir sur la carte
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => window.open(`tel:${pharmacy.telephone}`, "_self")}
                      >
                        Appeler
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;
