import { Button } from "@/components/ui/button";
import { Activity, LogOut, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/services/skinnerApi";
import ThemeToggle from "../components/ThemeToggle";
import { useTranslation } from "../context/LanguageContext";

export default function DashboardNavbar({ role = "patient", name, email, specialization }) {
  const { logout } = useAuth();
  const { lang, toggleLanguage, t } = useTranslation();

  const getSpecialtyLabel = (spec) => {
    if (!spec || spec === "Specialization") return t("specialization");
    const normalized = spec.toLowerCase().replace(/[\s_-]+/g, "_");
    const key = `specialty_${normalized}`;
    const translated = t(key);
    return translated !== key ? translated : spec;
  };

  const handleLogout = () => {
    // Best-effort server-side session revocation; don't await
    authApi.logout().catch(() => {});
    logout(); // clears storage, cancels refresh timer, redirects to /sign-in
  };

  const config = {
    doctor: {
      title: t("doctor_portal"),
      bg: "bg-[#DBEAFE]",
      color: "text-[#155DFC]",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 2V4" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 2V4" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 3H4C3.46957 3 2.96086 3.21071 2.58579 3.58579C2.21071 3.96086 2 4.46957 2 5V9C2 10.5913 2.63214 12.1174 3.75736 13.2426C4.88258 14.3679 6.4087 15 8 15C9.5913 15 11.1174 14.3679 12.2426 13.2426C13.3679 12.1174 14 10.5913 14 9V5C14 4.46957 13.7893 3.96086 13.4142 3.58579C13.0391 3.21071 12.5304 3 12 3H11" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 15C8 16.5913 8.63214 18.1174 9.75736 19.2426C10.8826 20.3679 12.4087 21 14 21C15.5913 21 17.1174 20.3679 18.2426 19.2426C19.3679 18.1174 20 16.5913 20 15V12" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12C21.1046 12 22 11.1046 22 10C22 8.89543 21.1046 8 20 8C18.8954 8 18 8.89543 18 10C18 11.1046 18.8954 12 20 12Z" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      getRight: () => (
        <>
          <span className="line-clamp-1 max-w-[120px] text-[12px] font-medium md:max-w-[180px]">{name || "Dr. Name"}</span>
          <span className="line-clamp-1 max-w-[120px] text-[10px] font-normal text-gray-500 md:max-w-[180px]">{getSpecialtyLabel(specialization)}</span>
        </>
      ),
    },
    patient: {
      title: t("patient_portal"),
      bg: "bg-[#DBEAFE]",
      color: "text-[#155DFC]",
      icon: <Activity size={18} />,
      getRight: () => (
        <>
          <span className="line-clamp-1 max-w-[120px] text-[12px] font-medium md:max-w-[180px]">{name || "User"}</span>
          <span className="line-clamp-1 max-w-[120px] text-[10px] font-normal text-gray-500 md:max-w-[180px]">{email || ""}</span>
        </>
      ),
    },
    admin: {
      title: t("admin_portal"),
      bg: "bg-[#F3E8FF]",
      color: "text-[#9810FA]",
      icon: <Shield size={18} />,
      getRight: () => (
        <>
          <span className="line-clamp-1 max-w-[120px] text-[12px] font-medium md:max-w-[180px]">{name || "Admin"}</span>
          <span className="line-clamp-1 max-w-[120px] text-[10px] font-normal text-gray-500 md:max-w-[180px]">Administrator</span>
        </>
      ),
    },
  };

  const current = config[role];
  const targetLink = `/${role}-portal`;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white px-4 py-3 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="mx-auto flex max-w-[1110px] items-center justify-between">
        <Link to={targetLink} className="flex min-w-0 items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Skinner Logo"
            className="size-8 rounded-md object-contain bg-white border border-gray-100 dark:border-zinc-800"
          />
          <div className="flex flex-col min-w-0">
            <span className="truncate text-[13px] font-bold dark:text-white">Skinner</span>
            <span className="truncate text-[11px] font-normal text-gray-600 dark:text-zinc-400">{current.title}</span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-black md:gap-6">
          <div className="flex flex-col items-end min-w-0 dark:text-zinc-300">{current.getRight()}</div>
          
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

          <Button size="sm" className="h-8 rounded-md px-3 text-[12px] dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900" variant="outline" onClick={handleLogout}>
            <LogOut className="mr-1 size-3.5" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
