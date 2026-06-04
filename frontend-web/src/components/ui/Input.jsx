import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";

function Input({
  label,
  error,
  helperText,
  type = "text",
  options = [],
  placeholder,
  className = "",
  inputClassName = "",
  ...props
}) {
  const hasError = Boolean(error);
  const controlClass = `w-full rounded-2xl border bg-white px-3.5 py-2.5 text-sm text-[#1F2937] outline-none transition duration-200 placeholder:text-[#6B7280]/70 disabled:cursor-not-allowed disabled:bg-[#F5F7FA] disabled:text-[#6B7280] ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
      : "border-[#2F6E9E]/15 focus:border-[#2FA6A3] focus:ring-4 focus:ring-[#35C3A3]/20"
  } ${inputClassName}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="mb-1.5 block text-xs font-black tracking-tight text-[#1F2937]">
          {label}
        </label>
      )}

      {type === "select" ? (
        <select className={`${controlClass} appearance-none`} aria-invalid={hasError} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value ?? option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className={controlClass}
          aria-invalid={hasError}
          {...props}
        />
      )}

      {(error || helperText) && (
        <p
          className={`mt-1.5 flex items-center gap-2 text-xs ${
            hasError ? "font-semibold text-red-600" : "text-[#6B7280]"
          }`}
        >
          {hasError && <FontAwesomeIcon icon={faCircleExclamation} className="h-3.5 w-3.5" />}
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default Input;
