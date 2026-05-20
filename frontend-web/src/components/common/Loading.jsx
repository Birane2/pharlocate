function Loading({ label = "Chargement..." }) {
  return (
    <div className="rounded-xl border border-pharmaBorder bg-white px-4 py-3 text-sm text-pharmaText">
      {label}
    </div>
  );
}

export default Loading;
