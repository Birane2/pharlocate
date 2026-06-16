import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight,
  faCheckCircle,
  faClock,
  faTruckFast,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import PharmacienLayout from "../../layouts/PharmacienLayout";
import DeliveryTable from "../../components/delivery/DeliveryTable";
import DeliveryStatusBadge from "../../components/delivery/DeliveryStatusBadge";
import GoogleMapsButton from "../../components/delivery/GoogleMapsButton";
import {
  cancelDelivery,
  getPharmacistDeliveries,
  markDeliveryDelivered,
  markDeliveryInProgress,
} from "../../services/pharmacistDeliveryService";

function StatCard({ label, value, icon, tone = "blue" }) {
  const tones = {
    blue: "bg-[#2F6E9E]/10 text-[#2F6E9E]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-black text-[#1C2B4A]">{value}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#6B7280]">
            {label}
          </p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <FontAwesomeIcon icon={icon} />
        </div>
      </div>
    </div>
  );
}

function MedicinesPreview({ medicines = [] }) {
  if (!medicines.length) {
    return <p className="text-sm font-semibold text-[#6B7280]">Aucun medicament detaille.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {medicines.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] px-3 py-2"
        >
          <span className="text-sm font-bold text-[#1C2B4A]">{item.name}</span>
          <span className="text-xs font-black text-[#2F6E9E]">x{item.quantity}</span>
        </div>
      ))}
    </div>
  );
}

function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const stats = useMemo(() => {
    const pending = deliveries.filter((item) => item.delivery_status === "en_attente").length;
    const inProgress = deliveries.filter((item) => item.delivery_status === "en_cours").length;
    const delivered = deliveries.filter((item) => item.delivery_status === "livree").length;
    const cancelled = deliveries.filter((item) => item.delivery_status === "annulee").length;

    return {
      total: deliveries.length,
      pending,
      inProgress,
      delivered,
      cancelled,
    };
  }, [deliveries]);

  const loadDeliveries = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const data = await getPharmacistDeliveries();
      setDeliveries(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Impossible de charger les livraisons."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    getPharmacistDeliveries()
      .then((data) => {
        if (!ignore) {
          setDeliveries(data);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err?.response?.data?.detail ||
              err?.response?.data?.error ||
              "Impossible de charger les livraisons."
          );
        }
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

  const updateStatus = async (delivery, action, message) => {
    setBusyId(delivery.id);
    setError("");
    setSuccess("");

    try {
      await action(delivery.id);
      setSuccess(message);
      await loadDeliveries({ silent: true });
      setSelectedDelivery((current) =>
        current?.id === delivery.id ? null : current
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Impossible de modifier le statut de livraison."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PharmacienLayout
      title="Livraisons"
      headerSubtitle="Gerez les commandes a livrer et ouvrez la position client."
    >
      <div className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total" value={stats.total} icon={faTruckFast} />
          <StatCard label="En attente" value={stats.pending} icon={faClock} tone="amber" />
          <StatCard label="En cours" value={stats.inProgress} icon={faTruckFast} />
          <StatCard label="Livrees" value={stats.delivered} icon={faCheckCircle} tone="green" />
          <StatCard label="Annulees" value={stats.cancelled} icon={faXmark} tone="red" />
        </section>

        <section className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#1C2B4A]">Commandes en livraison</h2>
              <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                Position client accessible via Google Maps uniquement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadDeliveries({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F6E9E] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#255C86] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faArrowRotateRight} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Actualisation..." : "Actualiser"}
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#E2E8F2] bg-white p-8 text-center text-sm font-bold text-[#6B7280] shadow-sm">
            Chargement des livraisons...
          </div>
        ) : (
          <DeliveryTable
            deliveries={deliveries}
            busyId={busyId}
            onView={setSelectedDelivery}
            onInProgress={(delivery) =>
              updateStatus(delivery, markDeliveryInProgress, "Livraison marquee en cours.")
            }
            onDelivered={(delivery) =>
              updateStatus(delivery, markDeliveryDelivered, "Livraison marquee comme livree.")
            }
            onCancel={(delivery) =>
              updateStatus(delivery, cancelDelivery, "Livraison annulee.")
            }
          />
        )}
      </div>

      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2B4A]/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-[#E2E8F2] bg-white p-5 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F2] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#2FA6A3]">
                  Commande #{selectedDelivery.reservation_id}
                </p>
                <h3 className="mt-1 text-xl font-black text-[#1C2B4A]">
                  {selectedDelivery.client_name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                  {selectedDelivery.client_phone}
                </p>
              </div>
              <DeliveryStatusBadge status={selectedDelivery.delivery_status} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-[#F8FAFC] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                  Adresse livraison
                </p>
                <p className="mt-2 text-sm font-bold text-[#1C2B4A]">
                  {selectedDelivery.address || "Adresse indisponible"}
                </p>
                <div className="mt-3">
                  <GoogleMapsButton
                    latitude={selectedDelivery.latitude_client}
                    longitude={selectedDelivery.longitude_client}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                  Paiement et montant
                </p>
                <p className="mt-2 text-sm font-bold text-[#1C2B4A]">
                  Paiement : {selectedDelivery.payment_status}
                </p>
                <p className="mt-1 text-lg font-black text-[#2F6E9E]">
                  {Number(selectedDelivery.total_amount || 0).toLocaleString("fr-FR")} MRU
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#E2E8F2] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                Medicaments commandes
              </p>
              <MedicinesPreview medicines={selectedDelivery.medicines} />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="rounded-xl border border-[#D8E3EE] bg-white px-4 py-2 text-sm font-black text-[#1C2B4A] transition hover:bg-[#F8FAFC]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </PharmacienLayout>
  );
}

export default Deliveries;
