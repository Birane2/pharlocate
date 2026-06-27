import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faCommentDots,
  faPaperPlane,
  faPencil,
  faReply,
  faStar,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ErrorMessage from "../../components/common/ErrorMessage";
import Loading from "../../components/common/Loading";
import { pharmacistLinks } from "../../routes/dashboardLinks";
import {
  deleteReply,
  getPharmacienAvis,
  postReply,
  updateReply,
} from "../../services/avisService";

const PAGE_SIZE = 5;
const GOLD = "#F4B400";

const emptyData = {
  pharmacie: null,
  stats: {
    note_moyenne: 0,
    total: 0,
    repartition: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  },
  results: [],
};

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return "Votre session a expire. Veuillez vous reconnecter.";
  }

  if (error.response?.status === 403) {
    return "Acces reserve aux pharmaciens.";
  }

  return "Impossible de charger les avis pour le moment.";
}

function formatDate(value) {
  if (!value) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getMostFrequentRating(repartition = {}) {
  const entries = [5, 4, 3, 2, 1].map((note) => ({
    note,
    count: repartition[note] || repartition[String(note)] || 0,
  }));
  const best = entries.reduce(
    (currentBest, item) => (item.count > currentBest.count ? item : currentBest),
    { note: 0, count: 0 }
  );

  return best.count > 0 ? best.note : 0;
}

function getUserInitials(name = "Client") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} etoile(s) sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesomeIcon
          key={star}
          icon={faStar}
          className={`h-3.5 w-3.5 ${star <= value ? "text-[#F4B400]" : "text-[#E2E8F2]"}`}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, tone = "blue" }) {
  const toneClass =
    tone === "gold"
      ? "bg-[#F4B400]/12 text-[#F4B400]"
      : tone === "turquoise"
        ? "bg-[#2FA6A3]/10 text-[#2FA6A3]"
        : "bg-[#2F6E9E]/10 text-[#2F6E9E]";

  return (
    <article className="rounded-2xl border border-[#E2E8F2] bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-black text-[#1C2B4A]">{value}</p>
          <p className="mt-0.5 text-xs font-bold text-[#6B7280]">{label}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

function ReplyForm({ reviewId, existingReply, onSuccess, onCancel }) {
  const [message, setMessage] = useState(existingReply?.message || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const trimmed = message.trim();
    if (!trimmed) {
      setError("La reponse ne peut pas etre vide.");
      return;
    }
    setSubmitting(true);
    try {
      let result;
      if (existingReply) {
        result = await updateReply(existingReply.id, trimmed);
      } else {
        result = await postReply(reviewId, trimmed);
      }
      onSuccess(result);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Une erreur est survenue.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ecrivez votre reponse officielle..."
        rows={3}
        disabled={submitting}
        className="w-full resize-none rounded-xl border border-[#2F6E9E]/20 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1C2B4A] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2FA6A3] focus:ring-2 focus:ring-[#2FA6A3]/15 disabled:opacity-60"
      />
      {error && (
        <p className="text-xs font-semibold text-[#DC2626]">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-[#2F6E9E] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#265B84] disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
          {submitting ? "Envoi..." : existingReply ? "Modifier" : "Repondre"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#6B7280] transition hover:bg-[#F1F5F9] disabled:opacity-60"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function ReviewItem({ review, onReplyChanged }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reply, setReply] = useState(review.reply || null);
  const [deleting, setDeleting] = useState(false);

  const handleReplySuccess = (newReply) => {
    setReply(newReply);
    setShowForm(false);
    setEditing(false);
    onReplyChanged();
  };

  const handleDeleteReply = async () => {
    if (!window.confirm("Supprimer cette reponse ?")) return;
    setDeleting(true);
    try {
      await deleteReply(reply.id);
      setReply(null);
      onReplyChanged();
    } catch {
      /* silent */
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="rounded-xl border border-[#E2E8F2] px-3 py-2.5 transition hover:border-[#2F6E9E]/25 hover:bg-[#F8FAFC]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2F6E9E]/10 text-xs font-black text-[#2F6E9E]">
          {getUserInitials(review.user_username)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#1C2B4A]">
              {review.user_username || "Client"}
            </p>
            <StarRating value={Number(review.note || 0)} />
          </div>
          <p className="mt-1 text-sm leading-5 text-[#4B5563]">
            {review.commentaire || "Aucun commentaire."}
          </p>
          <time className="mt-1 block text-[11px] font-semibold text-[#6B7280]">
            {formatDate(review.date)}
          </time>

          {reply && !editing && (
            <div className="mt-2.5 rounded-xl border border-[#2FA6A3]/25 bg-[#E8F7F3] px-3 py-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-black text-[#2FA6A3]">
                  <FontAwesomeIcon icon={faCheckCircle} className="h-3 w-3" />
                  Reponse officielle
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#2F6E9E]/10 hover:text-[#2F6E9E]"
                    title="Modifier la reponse"
                  >
                    <FontAwesomeIcon icon={faPencil} className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteReply}
                    disabled={deleting}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#EF4444]/10 hover:text-[#EF4444] disabled:opacity-50"
                    title="Supprimer la reponse"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm leading-5 text-[#0F6B58]">{reply.message}</p>
              <time className="mt-1 block text-[10px] font-semibold text-[#6B7280]">
                {formatDate(reply.updated_at || reply.created_at)}
              </time>
            </div>
          )}

          {editing && (
            <div className="mt-2">
              <ReplyForm
                reviewId={review.id}
                existingReply={reply}
                onSuccess={handleReplySuccess}
                onCancel={() => setEditing(false)}
              />
            </div>
          )}

          {!reply && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#2F6E9E] transition hover:text-[#265B84]"
            >
              <FontAwesomeIcon icon={faReply} className="h-3 w-3" />
              Repondre
            </button>
          )}

          {!reply && showForm && (
            <ReplyForm
              reviewId={review.id}
              existingReply={null}
              onSuccess={handleReplySuccess}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function PharmacienAvis() {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const load = () => {
    setLoading(true);
    setError("");
    let active = true;

    getPharmacienAvis()
      .then((response) => {
        if (active) setData(response);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  };

  useEffect(load, []);

  const reviews = useMemo(() => data.results || [], [data.results]);
  const total = data.stats?.total || 0;
  const average = Number(data.stats?.note_moyenne || 0).toFixed(1);
  const mostFrequentRating = getMostFrequentRating(data.stats?.repartition);

  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const paginatedReviews = reviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <DashboardLayout
      title="Avis clients"
      links={pharmacistLinks}
      headerSubtitle="Consultez les notes, commentaires et repondez aux avis de votre pharmacie."
    >
      <div className="mx-auto max-w-7xl space-y-3">
        {loading ? (
          <Loading label="Chargement des avis..." />
        ) : (
          <>
            <ErrorMessage message={error} />

            {!error && (
              <>
                <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard
                    label="Note moyenne"
                    value={`${average}/5`}
                    icon={faStar}
                    tone="gold"
                  />
                  <StatCard
                    label="Avis recus"
                    value={total}
                    icon={faCommentDots}
                    tone="turquoise"
                  />
                  <StatCard
                    label="Note frequente"
                    value={mostFrequentRating ? `${mostFrequentRating} etoiles` : "-"}
                    icon={faChartSimple}
                  />
                </section>

                <section className="grid gap-3 xl:grid-cols-[0.85fr_1.35fr]">
                  <article className="rounded-2xl border border-[#E2E8F2] bg-white p-3 shadow-sm">
                    <h2 className="text-sm font-bold text-[#1C2B4A]">
                      Repartition des notes
                    </h2>
                    <div className="mt-3 space-y-2">
                      {[5, 4, 3, 2, 1].map((note) => {
                        const count =
                          data.stats?.repartition?.[note] ||
                          data.stats?.repartition?.[String(note)] ||
                          0;
                        const width = total ? Math.round((count / total) * 100) : 0;

                        return (
                          <div key={note} className="flex items-center gap-2 text-xs">
                            <span className="flex w-8 items-center gap-1 font-black text-[#1C2B4A]">
                              {note}
                              <FontAwesomeIcon
                                icon={faStar}
                                className="h-3 w-3"
                                style={{ color: GOLD }}
                              />
                            </span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${width}%`, backgroundColor: GOLD }}
                              />
                            </div>
                            <span className="w-6 text-right font-bold text-[#6B7280]">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  <article className="overflow-hidden rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
                    <div className="border-b border-[#E2E8F2] px-3 py-2.5">
                      <h2 className="text-sm font-bold text-[#1C2B4A]">
                        Commentaires clients
                      </h2>
                    </div>

                    <div className="space-y-2 p-3">
                      {paginatedReviews.length === 0 && (
                        <p className="rounded-xl bg-[#F8FAFC] px-3 py-4 text-sm text-[#6B7280]">
                          Aucun avis client a afficher.
                        </p>
                      )}

                      {paginatedReviews.map((review) => (
                        <ReviewItem
                          key={review.id}
                          review={review}
                          onReplyChanged={load}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F2] bg-[#F8FAFC] px-3 py-2">
                      <p className="text-xs font-semibold text-[#6B7280]">
                        Page {currentPage} sur {totalPages}
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F6E9E]/15 bg-white text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F6E9E]"
                          aria-label="Page precedente"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() =>
                            setCurrentPage((page) => Math.min(totalPages, page + 1))
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F6E9E]/15 bg-white text-[#2F6E9E] transition hover:bg-[#2F6E9E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F6E9E]"
                          aria-label="Page suivante"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </article>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PharmacienAvis;
