import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import ReviewForm from "../reviews/ReviewForm";

function PharmacyReviews({
  avis = [],
  noteMoyenne = 0,
  totalAvis = 0,
  canReview = false,
  isAuthenticated = false,
  submittingReview = false,
  reviewError = "",
  reviewSuccess = "",
  onSubmitReview,
  onGoToLogin,
}) {
  return (
    <div className="space-y-6">
      <Card
        title="Avis utilisateurs"
        subtitle="Les avis publics aident a evaluer l'experience dans cette pharmacie."
        action={<Badge variant="blue">{noteMoyenne}/5</Badge>}
        className="h-full"
      >
        <div className="mb-4 rounded-2xl border border-[#2F6E9E]/10 bg-[#F7FBFD] p-4">
          <p className="text-sm leading-7 text-pharmaTextLight">
            {totalAvis > 0
              ? `${totalAvis} avis public(s) enregistre(s) pour cette pharmacie.`
              : "Aucun avis n'a encore ete depose pour cette pharmacie."}
          </p>
        </div>

        {avis.length === 0 ? (
          <p className="text-sm leading-7 text-pharmaTextLight">
            Aucun avis disponible pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {avis.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-[#2F6E9E]/10 bg-white p-4 shadow-[0_10px_24px_rgba(47,110,158,0.06)]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-black tracking-tight text-[#16324A]">
                      {review.user_username}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-pharmaTextLight">
                      Note {review.note}/5
                    </p>
                  </div>
                  <Badge variant="info">
                    {new Date(review.date).toLocaleDateString("fr-FR")}
                  </Badge>
                </div>
                <p className="mt-4 text-sm leading-7 text-pharmaTextLight">
                  {review.commentaire}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {canReview ? (
        <ReviewForm
          disabled={submittingReview}
          error={reviewError}
          successMessage={reviewSuccess}
          onSubmit={onSubmitReview}
        />
      ) : (
        <Card
          title="Publier un avis"
          subtitle="Seuls les utilisateurs connectes peuvent noter cette pharmacie."
          hover={false}
          className="border-[#2F6E9E]/10 bg-white/95"
        >
          <div className="space-y-4">
            <p className="text-sm leading-7 text-pharmaTextLight">
              {isAuthenticated
                ? "Votre compte actuel ne peut pas publier d'avis sur cette page."
                : "Connectez-vous pour laisser une note et un commentaire sur cette pharmacie."}
            </p>

            {!isAuthenticated && (
              <Button type="button" variant="outline" onClick={onGoToLogin}>
                Se connecter pour commenter
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default PharmacyReviews;
