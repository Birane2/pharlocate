export function StatusBadge({ status }) {
  const styles = {
    valide: "bg-emerald-50 text-emerald-700",
    payee: "bg-emerald-50 text-emerald-700",
    active: "bg-emerald-50 text-emerald-700",
    approved: "bg-emerald-50 text-emerald-700",
    processed: "bg-blue-50 text-blue-700",
    en_attente_validation: "bg-amber-50 text-amber-700",
    en_attente_paiement: "bg-amber-50 text-amber-700",
    pending_payment: "bg-amber-50 text-amber-700",
    pending_validation: "bg-amber-50 text-amber-700",
    pending: "bg-amber-50 text-amber-700",
    requested: "bg-amber-50 text-amber-700",
    validated: "bg-emerald-50 text-emerald-700",
    refuse: "bg-red-50 text-red-700",
    rejected: "bg-red-50 text-red-700",
    cancelled: "bg-slate-100 text-slate-600",
    expiree: "bg-slate-100 text-slate-600",
    rembourse: "bg-blue-50 text-blue-700",
    remboursee: "bg-blue-50 text-blue-700",
    refunded: "bg-blue-50 text-blue-700",
    demande: "bg-amber-50 text-amber-700",
    effectue: "bg-blue-50 text-blue-700",
    non_paye: "bg-slate-100 text-slate-700",
    annule: "bg-slate-100 text-slate-600",
    annulee: "bg-slate-100 text-slate-600",
    paid: "bg-emerald-50 text-emerald-700",
    overdue: "bg-red-50 text-red-700",
  };
  const labels = {
    valide: "Valide",
    payee: "Payee",
    active: "Actif",
    approved: "Approuvee",
    processed: "Traitee",
    en_attente_validation: "En attente",
    en_attente_paiement: "Paiement attendu",
    pending_payment: "Paiement attendu",
    pending_validation: "En validation",
    pending: "En attente",
    requested: "Demandee",
    validated: "Validee",
    refuse: "Refuse",
    rejected: "Refuse",
    cancelled: "Annulee",
    expiree: "Expire",
    rembourse: "Rembourse",
    remboursee: "Remboursee",
    refunded: "Remboursee",
    demande: "Demande",
    effectue: "Effectue",
    non_paye: "Non paye",
    annule: "Annule",
    annulee: "Annulee",
    paid: "Payee",
    overdue: "En retard",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {labels[status] || status || "-"}
    </span>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <article className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#1C2B4A]">{value}</p>
      {hint && <p className="mt-1 text-xs font-semibold text-[#6B7280]">{hint}</p>}
    </article>
  );
}

export function EmptyState({ label = "Aucune donnee disponible." }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-sm font-semibold text-[#6B7280]">
      {label}
    </div>
  );
}

export function PageCard({ title, children, action }) {
  return (
    <section className="rounded-2xl border border-[#E2E8F2] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[#1C2B4A]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
