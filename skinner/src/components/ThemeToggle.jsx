import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("skinner-theme");
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("skinner-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white/80 p-0 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-zinc-950/80 dark:hover:bg-zinc-900"
      aria-label="Toggle theme"
    >
      {/* Icon containers with smooth spinning/scaling animation */}
      <div className="relative size-5 overflow-hidden">
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
            theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        >
          <Sun className="size-5 text-amber-500 fill-amber-500/20" />
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
            theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        >
          <Moon className="size-5 text-indigo-400 fill-indigo-400/20" />
        </div>
      </div>
    </button>
  );
}
