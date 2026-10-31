"use client";

const STORAGE_KEY = "tt-theme";

type Props = {
  lightLabel: string;
  darkLabel: string;
};

/**
 * The active theme lives on <html class="dark"> (set before paint in the root
 * layout). Icons and labels switch via the `dark:` variant, so the server and
 * client render identical markup.
 */
export function ThemeToggle({ lightLabel, darkLabel }: Props) {
  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--chip)] hover:text-[var(--text)]"
    >
      <span className="sr-only dark:hidden">{darkLabel}</span>
      <span className="sr-only hidden dark:inline">{lightLabel}</span>
      {/* Moon (shown in light mode) */}
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="dark:hidden">
        <path d="M20.5 14.1A8.5 8.5 0 1 1 9.9 3.5a6.6 6.6 0 0 0 10.6 10.6z" />
      </svg>
      {/* Sun (shown in dark mode) */}
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="hidden dark:block">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
