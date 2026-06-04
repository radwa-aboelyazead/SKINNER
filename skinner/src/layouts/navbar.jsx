import { Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-[linear-gradient(90deg,#DBE7FE_0%,#F1E8FF_100%)] px-8 py-5 dark:bg-none dark:bg-zinc-950 dark:border-b dark:border-zinc-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Left side - Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <div className="flex size-10 items-center justify-center rounded-md bg-blue-600 text-white text-sm font-semibold">
            <Activity />
          </div>
          <span className="text-4 font-semibold text-black dark:text-white md:text-[18px]">
            Skinner
          </span>
        </Link>

        {/* Right side - Navigation Links */}
        <div className="flex items-center gap-6 md:gap-10 text-black dark:text-white text-[14px] md:text-[16px] font-normal">
          <Link to="/" className="transition hover:opacity-70 hidden md:block dark:text-zinc-300">
            Home
          </Link>
          <Link to="/features" className="transition hover:opacity-70 hidden md:block dark:text-zinc-300">
            Features
          </Link>
          <Link to="/contact-us" className="transition hover:opacity-70 dark:text-zinc-300">
            Contact Us
          </Link>
          <ThemeToggle />
          <button
            onClick={() => navigate("/sign-in")}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-white text-[14px] hover:bg-blue-700 transition cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}

