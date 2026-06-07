import { useState } from "react";
import { Activity, Menu, X, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTranslation } from "../context/LanguageContext";

export default function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { lang, toggleLanguage, t } = useTranslation();

  return (
    <nav className="w-full bg-[linear-gradient(90deg,#DBE7FE_0%,#F1E8FF_100%)] px-6 py-4 dark:bg-none dark:bg-zinc-950 dark:border-b dark:border-zinc-800 relative z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Left side - Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <img
            src="/logo.jpeg"
            alt="Skinner Logo"
            className="size-10 rounded-md object-contain bg-white border border-gray-100 dark:border-zinc-800"
          />
          <span className="text-[16px] font-semibold text-black dark:text-white md:text-[18px]">
            Skinner
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-black dark:text-white text-[15px] font-normal">
          <Link to="/" className="transition hover:opacity-70 dark:text-zinc-300">
            {t("home")}
          </Link>
          <Link to="/features" className="transition hover:opacity-70 dark:text-zinc-300">
            {t("features")}
          </Link>
          <Link to="/contact-us" className="transition hover:opacity-70 dark:text-zinc-300">
            {t("contact_us")}
          </Link>
          
          <ThemeToggle />
          
          {/* Globe Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-black dark:text-white hover:opacity-70 transition cursor-pointer"
            title={lang === "en" ? "Switch to Arabic" : "تغيير للغة الإنجليزية"}
          >
            <Globe className="size-4" />
            <span className="text-[13px] font-medium">{lang === "en" ? "AR" : "EN"}</span>
          </button>

          <button
            onClick={() => navigate("/sign-in")}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-white text-[14px] hover:bg-blue-700 transition cursor-pointer"
          >
            {t("sign_in")}
          </button>
        </div>

        {/* Mobile controls (hamburger, theme toggle) */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          {/* Mobile Globe Toggle */}
          <button
            onClick={toggleLanguage}
            className="text-black dark:text-white p-1 hover:opacity-75 transition cursor-pointer"
            title={lang === "en" ? "Switch to Arabic" : "تغيير للغة الإنجليزية"}
          >
            <Globe className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-black dark:text-white p-1"
          >
            {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-lg px-6 py-4 flex flex-col gap-4 md:hidden text-black dark:text-white text-[15px] font-medium z-40 animate-in fade-in slide-in-from-top-5 duration-200">
          <Link to="/" onClick={() => setIsOpen(false)} className="py-1 transition hover:opacity-70 dark:text-zinc-300">
            {t("home")}
          </Link>
          <Link to="/features" onClick={() => setIsOpen(false)} className="py-1 transition hover:opacity-70 dark:text-zinc-300">
            {t("features")}
          </Link>
          <Link to="/contact-us" onClick={() => setIsOpen(false)} className="py-1 transition hover:opacity-70 dark:text-zinc-300">
            {t("contact_us")}
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/sign-in");
            }}
            className="w-full rounded-md bg-blue-600 py-2.5 text-white text-[14px] hover:bg-blue-700 transition cursor-pointer"
          >
            {t("sign_in")}
          </button>
        </div>
      )}
    </nav>
  );
}

