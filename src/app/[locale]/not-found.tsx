import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-mono text-sm text-[var(--accent)]">404</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text)]">
        Page not found
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        The route does not exist in this locale.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[#041016]"
      >
        Go home
      </Link>
    </div>
  );
}
