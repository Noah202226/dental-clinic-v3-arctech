"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Monitor,
  LogOut,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/app/stores/authStore";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import clsx from "clsx";

export default function Header() {
  const { current, logout } = useAuthStore((state) => state);
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(timer);
    };
  }, []);

  const isLateNight = time.getHours() >= 22 || time.getHours() < 5;
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
    setIsMenuOpen(false); // Close menu on route change
  }, [pathname]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "fixed top-0 left-0 w-full z-50 transition-all duration-500",
        scrolled || isMenuOpen
          ? "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-b border-zinc-200 dark:border-zinc-800 py-3"
          : "bg-transparent py-4 lg:py-6",
      )}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-4 md:px-8">
        {/* Left: Logo Section */}
        <div className="flex items-center gap-4 lg:gap-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-lg md:text-xl font-black shadow-lg shadow-emerald-600/20 group-hover:rotate-12 transition-transform">
              D
            </div>
            <div className="hidden sm:block">
              <span className="text-xl md:text-2xl font-black tracking-tighter text-zinc-900 dark:text-white block leading-none">
                DentServe
              </span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">
                PRO SYSTEM
              </span>
            </div>
          </Link>

          {/* Clock Badge - Hidden on very small screens, simplified on medium */}
          <div
            className={clsx(
              "hidden md:flex items-center gap-4 lg:gap-6 px-4 lg:px-6 py-2 lg:py-3 rounded-[2rem] border transition-all duration-1000",
              isLateNight
                ? "bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                : "bg-zinc-100/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-sm",
            )}
          >
            <div className="flex items-center gap-2 lg:gap-3">
              <ClockIcon
                size={18}
                className={isLateNight ? "text-orange-500" : "text-emerald-500"}
              />
              <span
                className={clsx(
                  "font-mono font-black text-lg lg:text-2xl tracking-tighter transition-colors duration-1000",
                  isLateNight
                    ? "text-orange-500"
                    : "text-zinc-900 dark:text-zinc-100",
                )}
              >
                {time.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
            <div className="hidden lg:block h-6 w-[2px] bg-zinc-300 dark:bg-zinc-700 opacity-50" />
            <div className="hidden lg:flex items-center gap-3">
              <CalendarIcon size={18} className="text-zinc-400" />
              <span className="text-lg font-bold text-zinc-600 dark:text-zinc-400 tracking-tight">
                {time.toLocaleDateString([], {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <ThemeToggle theme={theme} setTheme={setTheme} />

            <div className="h-8 w-px bg-zinc-200 dark:border-zinc-800 mx-2" />

            {current ? (
              <UserMenu
                current={current}
                handleLogout={handleLogout}
                loading={loading}
              />
            ) : (
              <LoginButton />
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 md:hidden text-zinc-600 dark:text-zinc-400"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-6">
              {/* Mobile Time Display */}
              <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Current Time
                  </span>
                  <span className="text-xl font-black font-mono">
                    {time.toLocaleTimeString([], { hour12: false })}
                  </span>
                </div>
                <ThemeToggle theme={theme} setTheme={setTheme} />
              </div>

              {current ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                        Authorized
                      </span>
                      <span className="text-xl font-black">
                        {current.name || current.email.split("@")[0]}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-4 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-2xl"
                    >
                      <LogOut size={24} />
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-center uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                >
                  Login to System
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* Sub-components for cleaner code */

const ThemeToggle = ({ theme, setTheme }) => (
  <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900/80 rounded-xl lg:rounded-2xl border border-zinc-200 dark:border-zinc-800">
    {["light", "dark", "system"].map((t) => (
      <button
        key={t}
        onClick={() => setTheme(t)}
        className={clsx(
          "p-2 lg:p-2.5 rounded-lg lg:rounded-xl transition-all",
          theme === t
            ? "bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm"
            : "text-zinc-400",
        )}
      >
        {t === "light" && <Sun size={16} />}
        {t === "dark" && <Moon size={16} />}
        {t === "system" && <Monitor size={16} />}
      </button>
    ))}
  </div>
);

const UserMenu = ({ current, handleLogout, loading }) => (
  <div className="flex items-center gap-4">
    <div className="flex flex-col items-end">
      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 leading-none mb-1">
        Authorized
      </span>
      <span className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-none">
        {current.name || current.email.split("@")[0]}
      </span>
    </div>
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-10 h-10 flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:bg-red-600 transition-all"
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <LogOut size={20} />
      )}
    </button>
  </div>
);

const LoginButton = () => (
  <Link
    href="/login"
    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
  >
    Login
  </Link>
);
