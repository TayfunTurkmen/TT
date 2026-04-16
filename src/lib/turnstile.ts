export async function verifyTurnstileResponse(
  secret: string | null | undefined,
  token: string,
  ip: string,
): Promise<boolean> {
  if (!secret) return false;
  const trimmed = token.trim();
  if (!trimmed) return false;

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", trimmed);
    body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}
