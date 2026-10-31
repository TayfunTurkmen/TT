/**
 * Lightweight anti-bot checks for public forms:
 * - honeypot field (`website`) must stay empty
 * - form must not be submitted too quickly
 * - human confirmation checkbox must be checked
 */

export function isLikelyBotSubmission(formData: FormData): boolean {
  const honeypot = String(formData.get("website") ?? "").trim();
  // Elapsed time is measured in the browser (see useFormElapsed), so a visitor
  // whose device clock differs from the server's is not mistaken for a bot.
  const rawElapsed = formData.get("formElapsedMs");
  const elapsed = rawElapsed === null || rawElapsed === "" ? Number.NaN : Number(rawElapsed);
  const tooFast = Number.isFinite(elapsed) && elapsed < 900;
  return Boolean(honeypot) || tooFast;
}

export function hasHumanConfirmation(formData: FormData): boolean {
  const value = String(formData.get("humanCheck") ?? "").trim().toLowerCase();
  return value === "on" || value === "1" || value === "true" || value === "yes";
}

export function verifySimpleFormGuard(formData: FormData): boolean {
  return hasHumanConfirmation(formData) && !isLikelyBotSubmission(formData);
}
