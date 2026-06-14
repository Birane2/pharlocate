function extractMessage(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return extractMessage(value[0]);
  }

  if (typeof value === "object") {
    if (typeof value.error === "string") {
      return value.error;
    }

    if (typeof value.message === "string") {
      return value.message;
    }

    if (typeof value.detail === "string") {
      return value.detail;
    }

    for (const nestedValue of Object.values(value)) {
      const nestedMessage = extractMessage(nestedValue);
      if (nestedMessage) {
        return nestedMessage;
      }
    }
  }

  return "";
}

export function getApiErrorMessage(
  error,
  fallback = "Une erreur est survenue.",
  serverFallback = "Erreur serveur. Reessayez plus tard."
) {
  const status = error?.response?.status;
  const dataMessage = extractMessage(error?.response?.data);

  if (dataMessage) {
    return dataMessage;
  }

  if (status >= 500) {
    return serverFallback;
  }

  const rawMessage = error?.message || "";
  if (
    rawMessage &&
    rawMessage !== "Network Error" &&
    !rawMessage.includes("status code")
  ) {
    return rawMessage;
  }

  return fallback;
}

