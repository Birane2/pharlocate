import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCheck,
  faClipboardCheck,
  faClock,
  faEye,
  faImage,
  faLocationDot,
  faMotorcycle,
  faRotate,
  faTimes,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import {
  confirmOrder,
  getPharmacienOrders,
  markOrderDelivered,
  markOrderReady,
  prepareOrder,
  rejectPayment,
  validatePayment,
} from "../../services/financeService";
import { money, dateTime } from "../finance/financeFormat";

const paymentFilters = [
  { value: "all", label: "Toutes" },
  { value: "payment_pending", label: "Paiement en attente" },
  { value: "confirmee", label: "Confirmees" },
  { value: "en_preparation", label: "En preparation" },
  { value: "prete", label: "Pretes" },
  { value: "livree", label: "Livrees" },
  { value: "refusee", label: "Refusees" },
];

const orderStatus = {
  en_attente: ["En attente", "bg-amber-50 text-amber-700"],
  confirmee: ["Confirmee", "bg-[#2F6E9E]/10 text-[#2F6E9E]"],
  en_preparation: ["Preparation", "bg-indigo-50 text-indigo-700"],
  prete: ["Prete", "bg-[#2FA6A3]/10 text-[#167769]"],
  livree: ["Livree", "bg-emerald-50 text-emerald-700"],
  refusee: ["Refusee", "bg-red-50 text-red-700"],
  annulee: ["Annulee", "bg-slate-100 text-slate-600"],
};

const paymentStatus = {
  en_attente_verification: ["Paiement en attente", "bg-amber-50 text-amber-700"],
  valide: ["Paiement valide", "bg-emerald-50 text-emerald-700"],
  refuse: ["Paiement refuse", "bg-red-50 text-red-700"],
  annule: ["Paiement annule", "bg-slate-100 text-slate-600"],
  rembourse: ["Rembourse", "bg-blue-50 text-blue-700"],
};

function getApiErrorMessage(error, fallback = "Impossible de traiter cette action.") {
  const data = error?.response?.data;

  if (error?.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error?.response?.status === 403) {
    return "Vous n'etes pas autorise a traiter cette commande.";
  }

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  if (data?.error && typeof data.error === "object") {
    const firstValue = Object.values(data.error)[0];
    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }

  return fallback;
}

function Badge({ value, config }) {
  const [label, className] = config[value] || [
    value || "-",
    "bg-slate-100 text-slate-600",
  ];

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {label}
    </span>
  );
}

function typeLabel(type) {
  return type === "livraison" ? "Livraison" : "Retrait";
}

function getItemsSummary(order) {
  const items = order.items || [];

  if (items.length === 0) {
    return "Aucun medicament";
  }

  return items.map((item) => `${item.medicament_nom} x${item.quantite}`).join(", ");
}

function ReservationsList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");

    try {
      setOrders(await getPharmacienOrders());
    } catch (loadError) {
      setOrders([]);
      setError(getApiErrorMessage(loadError, "Impossible de charger les commandes."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    getPharmacienOrders()
      .then((data) => {
        if (!ignore) setOrders(data);
      })
      .catch((loadError) => {
        if (!ignore) {
          setError(getApiErrorMessage(loadError, "Impossible de charger les commandes."));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: orders.length,
      paymentPending: orders.filter((order) => order.statut === "en_attente_verification")
        .length,
      validated: orders.filter((order) => order.statut === "valide").length,
      ready: orders.filter((order) => order.reservation_status === "prete").length,
      deliveries: orders.filter(
        (order) =>
          order.reservation_type === "livraison" &&
          !["livree", "annulee", "refusee"].includes(order.reservation_status)
      ).length,
    }),
    [orders]
  );

  const visibleOrders = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "payment_pending") {
      return orders.filter((order) => order.statut === "en_attente_verification");
    }
    return orders.filter((order) => order.reservation_status === filter);
  }, [filter, orders]);

  const runAction = async (order, action, successMessage, options = {}) => {
    setActionLoadingId(order.id);
    setError("");
    setSuccess("");

    try {
      await action(order.id);
      setSuccess(successMessage);
      if (options.closeDetail) setSelectedOrder(null);
      await loadOrders();
    } catch (actionError) {
      setError(getApiErrorMessage(actionError));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (order) => {
    const reason = window.prompt("Motif du refus du paiement :");
    if (!reason || !reason.trim()) return;

    await runAction(
      order,
      (id) => rejectPayment(id, reason.trim()),
      "Paiement refuse. Le patient sera notifie.",
      { closeDetail: true }
    );
  };

  return (
    <DashboardLayout
      title="Commandes"
      links={pharmacistLinks}
      headerSubtitle="Validez les paiements et traitez les commandes patients."
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Commandes" value={stats.total} icon={faClipboardCheck} />
          <StatCard label="Paiements attente" value={stats.paymentPending} icon={faClock} tone="amber" />
          <StatCard label="Paiements valides" value={stats.validated} icon={faCheck} tone="green" />
          <StatCard label="Commandes pretes" value={stats.ready} icon={faBoxOpen} tone="teal" />
          <StatCard label="Livraisons actives" value={stats.deliveries} icon={faTruckFast} tone="blue" />
        </section>

        {(error || success) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#2FA6A3]/30 bg-[#2FA6A3]/10 text-[#167769]"
            }`}
          >
            {error || success}
          </div>
        )}

        <section className="rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#E2E8F2] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2FA6A3]">
                Gestion commandes
              </p>
              <h2 className="mt-1 text-xl font-black text-[#1C2B4A]">
                Paiements et reservations
              </h2>
            </div>
            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8E3EE] bg-white px-4 py-2 text-sm font-black text-[#2F6E9E] transition hover:bg-[#F8FAFC] disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faRotate} spin={loading} />
              Actualiser
            </button>
          </div>

          <div className="border-b border-[#E2E8F2] px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {paymentFilters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black transition ${
                    filter === item.value
                      ? "bg-[#2F6E9E] text-white shadow-sm"
                      : "bg-[#F1F5F9] text-[#6B7280] hover:bg-[#E8EEF5]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-[#6B7280]">
              Chargement des commandes...
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-[#6B7280]">
              Aucune commande dans cette categorie.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-left text-xs font-black uppercase tracking-[0.08em] text-[#6B7280]">
                    <th className="px-4 py-3">Commande</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Medicaments</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Paiement</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-[#E2E8F2] text-sm transition hover:bg-[#F8FAFC]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-black text-[#2F6E9E]">#{order.reservation}</p>
                        <p className="text-xs font-semibold text-[#6B7280]">
                          {dateTime(order.reservation_created_at || order.date_creation)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#1C2B4A]">
                          {order.client_name || order.user_name || `Client #${order.user}`}
                        </p>
                        <p className="text-xs font-semibold text-[#6B7280]">
                          {order.client_phone || "-"}
                        </p>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p className="truncate font-semibold text-[#6B7280]">
                          {getItemsSummary(order)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#2FA6A3]/10 px-3 py-1 text-xs font-black text-[#167769]">
                          <FontAwesomeIcon icon={order.reservation_type === "livraison" ? faMotorcycle : faBoxOpen} />
                          {typeLabel(order.reservation_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={order.statut} config={paymentStatus} />
                        <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                          {order.payment_method_name || order.method}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-black text-[#1C2B4A]">
                        {money(order.montant_total)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={order.reservation_status} config={orderStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F6E9E]/10 text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white"
                            aria-label="Voir detail commande"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          {order.capture_paiement_url && (
                            <a
                              href={order.capture_paiement_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2FA6A3]/10 text-[#167769] transition hover:bg-[#2FA6A3] hover:text-white"
                              aria-label="Voir capture paiement"
                            >
                              <FontAwesomeIcon icon={faImage} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          actionLoading={actionLoadingId === selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
          onValidate={() =>
            runAction(
              selectedOrder,
              validatePayment,
              "Paiement valide. Une transaction financiere a ete creee."
            )
          }
          onReject={() => handleReject(selectedOrder)}
          onConfirm={() =>
            runAction(selectedOrder, confirmOrder, "Commande confirmee.", {
              closeDetail: true,
            })
          }
          onPrepare={() =>
            runAction(selectedOrder, prepareOrder, "Commande en preparation.", {
              closeDetail: true,
            })
          }
          onReady={() =>
            runAction(selectedOrder, markOrderReady, "Commande marquee comme prete.", {
              closeDetail: true,
            })
          }
          onDelivered={() =>
            runAction(selectedOrder, markOrderDelivered, "Commande marquee comme livree.", {
              closeDetail: true,
            })
          }
        />
      )}
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, tone = "blue" }) {
  const toneClass = {
    blue: "bg-[#2F6E9E]/10 text-[#2F6E9E]",
    teal: "bg-[#2FA6A3]/10 text-[#167769]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <article className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-black text-[#1C2B4A]">{value}</p>
          <p className="mt-1 text-xs font-bold text-[#6B7280]">{label}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <FontAwesomeIcon icon={icon} />
        </span>
      </div>
    </article>
  );
}

function OrderDetailModal({
  order,
  actionLoading,
  onClose,
  onValidate,
  onReject,
  onConfirm,
  onPrepare,
  onReady,
  onDelivered,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2B4A]/45 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F2] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2FA6A3]">
              Commande #{order.reservation}
            </p>
            <h3 className="mt-1 text-2xl font-black text-[#1C2B4A]">
              {order.client_name || order.user_name || `Client #${order.user}`}
            </h3>
            <p className="mt-1 text-sm font-semibold text-[#6B7280]">
              {dateTime(order.reservation_created_at || order.date_creation)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-[#1C2B4A]"
          >
            Fermer
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <InfoPanel title="Medicaments commandes">
              <div className="space-y-2">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-3 py-2"
                  >
                    <div>
                      <p className="font-black text-[#1C2B4A]">{item.medicament_nom}</p>
                      <p className="text-xs font-semibold text-[#6B7280]">
                        {item.quantite} x {money(item.prix_unitaire)}
                      </p>
                    </div>
                    <p className="font-black text-[#2F6E9E]">{money(item.sous_total)}</p>
                  </div>
                ))}
                {(order.items || []).length === 0 && (
                  <p className="text-sm font-semibold text-[#6B7280]">
                    Aucun medicament detaille.
                  </p>
                )}
              </div>
            </InfoPanel>

            {order.delivery && (
              <InfoPanel title="Livraison">
                <div className="flex items-start gap-3 rounded-2xl bg-[#F8FAFC] p-3">
                  <FontAwesomeIcon icon={faLocationDot} className="mt-1 text-[#2FA6A3]" />
                  <div>
                    <p className="font-black text-[#1C2B4A]">{order.delivery.address}</p>
                    <p className="text-sm font-semibold text-[#6B7280]">
                      Tel: {order.delivery.phone || "-"}
                    </p>
                    {order.delivery.note && (
                      <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                        Note: {order.delivery.note}
                      </p>
                    )}
                  </div>
                </div>
              </InfoPanel>
            )}
          </div>

          <div className="space-y-4">
            <InfoPanel title="Paiement">
              <div className="space-y-3">
                <Row label="Methode" value={order.payment_method_name || order.method} />
                <Row label="Telephone client" value={order.client_phone || "-"} />
                <Row label="Transaction ID" value={order.reference_paiement || "-"} />
                <Row label="Medicaments" value={money(order.montant_medicaments)} />
                <Row label="Livraison" value={money(order.frais_livraison)} />
                <Row label="Total" value={money(order.montant_total)} strong />
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge value={order.statut} config={paymentStatus} />
                  <Badge value={order.reservation_status} config={orderStatus} />
                </div>
                {order.capture_paiement_url && (
                  <a
                    href={order.capture_paiement_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2FA6A3] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#238987]"
                  >
                    <FontAwesomeIcon icon={faImage} />
                    Voir la capture de paiement
                  </a>
                )}
              </div>
            </InfoPanel>

            <InfoPanel title="Actions">
              <div className="grid gap-2">
                {order.statut === "en_attente_verification" && (
                  <>
                    <ActionButton
                      label="Valider paiement"
                      icon={faCheck}
                      loading={actionLoading}
                      onClick={onValidate}
                    />
                    <ActionButton
                      label="Refuser paiement"
                      icon={faTimes}
                      tone="danger"
                      loading={actionLoading}
                      onClick={onReject}
                    />
                  </>
                )}
                {order.statut === "valide" && order.reservation_status === "en_attente" && (
                  <ActionButton
                    label="Confirmer commande"
                    icon={faClipboardCheck}
                    loading={actionLoading}
                    onClick={onConfirm}
                  />
                )}
                {order.reservation_status === "confirmee" && (
                  <ActionButton
                    label="Mettre en preparation"
                    icon={faTruckFast}
                    loading={actionLoading}
                    onClick={onPrepare}
                  />
                )}
                {order.reservation_status === "en_preparation" && (
                  <ActionButton
                    label="Marquer prete"
                    icon={faBoxOpen}
                    loading={actionLoading}
                    onClick={onReady}
                  />
                )}
                {order.reservation_status === "prete" && (
                  <ActionButton
                    label="Marquer livree"
                    icon={faCheck}
                    loading={actionLoading}
                    onClick={onDelivered}
                  />
                )}
                {order.statut !== "en_attente_verification" &&
                  !(
                    order.statut === "valide" &&
                    ["en_attente", "confirmee", "en_preparation", "prete"].includes(
                      order.reservation_status
                    )
                  ) && (
                    <p className="rounded-xl bg-[#F8FAFC] px-3 py-3 text-sm font-semibold text-[#6B7280]">
                      Aucune action disponible pour ce statut.
                    </p>
                  )}
              </div>
            </InfoPanel>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoPanel({ title, children }) {
  return (
    <section className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-black uppercase tracking-[0.1em] text-[#6B7280]">
        {title}
      </h4>
      {children}
    </section>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EEF2F6] pb-2 last:border-b-0 last:pb-0">
      <span className="text-sm font-semibold text-[#6B7280]">{label}</span>
      <span className={`text-right text-sm ${strong ? "font-black text-[#1C2B4A]" : "font-bold text-[#1C2B4A]"}`}>
        {value}
      </span>
    </div>
  );
}

function ActionButton({ label, icon, tone = "primary", loading, onClick }) {
  const classes =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[#2F6E9E] hover:bg-[#255879]";

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${classes}`}
    >
      <FontAwesomeIcon icon={icon} />
      {loading ? "Traitement..." : label}
    </button>
  );
}

export default ReservationsList;
