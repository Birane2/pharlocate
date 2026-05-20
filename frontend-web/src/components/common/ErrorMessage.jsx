function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-xl border border-pharmaDanger/30 bg-pharmaDanger/10 px-4 py-3 text-sm text-pharmaDanger">
      {message}
    </div>
  );
}

export default ErrorMessage;
