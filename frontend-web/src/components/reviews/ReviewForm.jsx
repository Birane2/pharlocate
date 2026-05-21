import { useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

const noteOptions = [
  { value: "5", label: "5 / 5" },
  { value: "4", label: "4 / 5" },
  { value: "3", label: "3 / 5" },
  { value: "2", label: "2 / 5" },
  { value: "1", label: "1 / 5" },
];

function ReviewForm({
  disabled = false,
  error = "",
  successMessage = "",
  onSubmit,
}) {
  const [note, setNote] = useState("5");
  const [commentaire, setCommentaire] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!commentaire.trim()) {
      setLocalError("Le commentaire est obligatoire.");
      return;
    }

    await onSubmit({
      note: Number(note),
      commentaire: commentaire.trim(),
      reset: () => {
        setNote("5");
        setCommentaire("");
      },
    });
  };

  return (
    <Card
      title="Laisser un avis"
      subtitle="Partagez votre experience pour aider les autres utilisateurs."
      hover={false}
      className="border-[#2F6E9E]/10 bg-white/95"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="select"
          label="Note"
          value={note}
          options={noteOptions}
          disabled={disabled}
          onChange={(event) => setNote(event.target.value)}
        />

        <div>
          <label className="mb-2 block text-sm font-black tracking-tight text-[#1F2937]">
            Commentaire
          </label>
          <textarea
            value={commentaire}
            disabled={disabled}
            onChange={(event) => setCommentaire(event.target.value)}
            placeholder="Decrivez votre experience avec cette pharmacie"
            className="min-h-[132px] w-full rounded-2xl border border-[#2F6E9E]/15 bg-white px-4 py-3 text-[#1F2937] outline-none transition duration-200 placeholder:text-[#6B7280]/70 focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#35C3A3]/20 disabled:cursor-not-allowed disabled:bg-[#F5F7FA] disabled:text-[#6B7280]"
          />
          {(localError || error) && (
            <p className="mt-2 text-sm font-semibold text-red-600">
              {localError || error}
            </p>
          )}
        </div>

        {successMessage && (
          <div className="rounded-2xl border border-[#5EC6B8]/30 bg-[#E8F7F3] px-4 py-3 text-sm font-medium text-[#13795f]">
            {successMessage}
          </div>
        )}

        <Button type="submit" className="w-full" loading={disabled}>
          Publier mon avis
        </Button>
      </form>
    </Card>
  );
}

export default ReviewForm;
