/**
 * Lightweight anti-bot checks for public forms:
 * - honeypot field (`website`) must stay empty
 * - form must not be submitted too quickly
 * - human confirmation checkbox must be checked
 */

export function isLikelyBotSubmission(formData: FormData): boolean {
  const honeypot = String(formData.get("website") ?? "").trim();
  const renderedAt = Number(String(formData.get("formRenderedAt") ?? "0"));
  const tooFast = Number.isFinite(renderedAt) && renderedAt > 0 && Date.now() - renderedAt < 900;
  return Boolean(honeypot) || tooFast;
}

export function hasHumanConfirmation(formData: FormData): boolean {
  const value = String(formData.get("humanCheck") ?? "").trim().toLowerCase();
  return value === "on" || value === "1" || value === "true" || value === "yes";
}

export function verifySimpleFormGuard(formData: FormData): boolean {
  return hasHumanConfirmation(formData) && !isLikelyBotSubmission(formData);
}
