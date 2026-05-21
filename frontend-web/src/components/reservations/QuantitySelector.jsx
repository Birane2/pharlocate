function clampValue(value, min, max) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return min;
  }

  return Math.min(Math.max(numericValue, min), max);
}

function QuantitySelector({
  value,
  min = 1,
  max = 99,
  disabled = false,
  onChange,
}) {
  const safeValue = clampValue(value, min, max);

  const updateValue = (nextValue) => {
    onChange(clampValue(nextValue, min, max));
  };

  return (
    <div className="inline-flex items-center rounded-2xl border border-[#E2E8F2] bg-white shadow-sm">
      <button
        type="button"
        disabled={disabled || safeValue <= min}
        onClick={() => updateValue(safeValue - 1)}
        className="flex h-11 w-11 items-center justify-center rounded-l-2xl text-lg font-bold text-[#1C2B4A] transition hover:bg-[#F0F5FB] disabled:cursor-not-allowed disabled:opacity-50"
      >
        -
      </button>

      <input
        type="number"
        min={min}
        max={max}
        value={safeValue}
        disabled={disabled}
        onChange={(event) => updateValue(event.target.value)}
        className="h-11 w-16 border-x border-[#E2E8F2] bg-transparent px-2 text-center text-sm font-semibold text-[#1C2B4A] outline-none"
      />

      <button
        type="button"
        disabled={disabled || safeValue >= max}
        onClick={() => updateValue(safeValue + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-r-2xl text-lg font-bold text-[#1C2B4A] transition hover:bg-[#F0F5FB] disabled:cursor-not-allowed disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}

export default QuantitySelector;
