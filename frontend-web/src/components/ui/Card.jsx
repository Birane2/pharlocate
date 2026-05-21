function Card({
  children,
  title,
  subtitle,
  action,
  hover = true,
  className = "",
  bodyClassName = "",
}) {
  return (
    <section
      className={`rounded-2xl border border-[#E2E8F2] bg-white shadow-sm transition duration-300 ${hover ? "hover:-translate-y-1 hover:shadow-md" : ""} ${className}`}
    >
      {(title || subtitle || action) && (
        <header className="flex flex-col gap-3 border-b border-[#E2E8F2] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div>
            {title && (
              <h2 className="text-lg font-bold tracking-tight text-[#1C2B4A]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm leading-6 text-[#6B7A99]">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}

      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export default Card;
