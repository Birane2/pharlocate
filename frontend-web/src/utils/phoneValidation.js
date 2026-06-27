// Validation du numéro de téléphone mauritanien (format local 8 chiffres)
// Opérateurs : 2xx = Chinguitel, 3xx = Mattel, 4xx = Moov Mauritel

export const PHONE_REGEX = /^[234]\d{7}$/;

/** Garde uniquement les chiffres et limite à 8 caractères. */
export function sanitizePhone(value) {
  return (value || '').replace(/\D/g, '').slice(0, 8);
}

/**
 * Retourne null si valide, sinon un message d'erreur lisible.
 * @param {string} value
 * @returns {string|null}
 */
export function validatePhone(value) {
  const v = (value || '').trim();
  if (!v) return 'Le numéro de téléphone est obligatoire.';
  if (v.length < 8) return 'Le numéro doit contenir exactement 8 chiffres.';
  if (v.length > 8) return 'Le numéro doit contenir exactement 8 chiffres.';
  if (!/^[234]/.test(v)) {
    return 'Doit commencer par 2 (Chinguitel), 3 (Mattel) ou 4 (Moov Mauritel).';
  }
  return null;
}
