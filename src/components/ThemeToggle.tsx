import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Theme toggle island. The current theme is already set on
 * <html data-theme> by the inline head script in Base.astro (before paint),
 * so on mount we READ that value rather than re-deciding — this keeps the
 * button label in sync and avoids a flash. We only persist + flip on click.
 */
export default function ThemeToggle() {
  // Start "dark" to match the documented default; corrected from the DOM on mount.
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode / storage disabled — toggle still works for the session.
    }
    setTheme(next);
  }

  // "Switch to <the other one>" describes the action, which is the useful label.
  const target: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${target} theme`;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {mounted && theme === "dark" ? <MoonIcon /> : <SunIcon />}
      </span>
      <span className="visually-hidden">{label}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
