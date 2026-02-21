"use client";

import { useAuthStore } from "@/app/stores/authStore";
import React, { useState, useEffect } from "react";
import {
  FiLogOut,
  FiMenu,
  FiSun,
  FiMoon,
  FiMonitor,
  FiClock,
} from "react-icons/fi";
import { useTheme } from "next-themes";
import clsx from "clsx";
import { useBranding } from "../context/BrandingProvider";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

function TopBar() {
  const { current, logout, loading } = useAuthStore();
  const { config } = useBranding();
  const { theme, setTheme } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isLateNight = now.getHours() >= 22 || now.getHours() < 5;

  const timeString = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const dateString = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Sa loob ng TopBar component...
  const confirmLogout = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <div className="flex flex-col">
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Confirm Logout
            </span>
            <span className="text-xs text-zinc-500">
              Are you sure you want to end your session?
            </span>
          </div>
          <div className="flex gap-2">
            {/* Cancel Button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {/* Confirm Button */}
            <button
              onClick={() => {
                toast.dismiss(t.id);
                logout(); // Ito ang magti-trigger ng Full Overlay loading
              }}
              className="flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white rounded-lg shadow-lg shadow-red-500/20 transition-transform active:scale-95"
              style={{ backgroundColor: "#ef4444" }} // Standard red for danger actions
            >
              Logout
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-right",
        style: {
          borderRadius: "16px",
          background: theme === "dark" ? "#18181b" : "#fff",
          color: theme === "dark" ? "#fff" : "#000",
          border: theme === "dark" ? "1px solid #27272a" : "1px solid #e4e4e7",
          padding: "12px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      },
    );
  };

  return (
    <>
      <div className="w-full navbar bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 sticky top-0 z-30 transition-all duration-500 py-2 md:py-3">
        {/* Mobile drawer toggle */}
        <div className="flex-none lg:hidden">
          <label
            htmlFor="dashboard-drawer"
            className="btn btn-ghost btn-sm md:btn-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <FiMenu size={20} />
          </label>
        </div>

        {/* Welcome Message */}
        <div className="flex-1 px-2">
          <h1 className="text-xs md:text-base font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1 md:gap-2">
            <span className="hidden sm:inline">Welcome back,</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-black tracking-tight text-sm md:text-lg truncate max-w-[100px] md:max-w-none">
              {current?.email?.split("@")[0]}
            </span>
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex-none flex items-center gap-2 md:gap-4 lg:gap-6">
          {/* DATA CLOCK */}
          <div
            className={clsx(
              "hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl border transition-all duration-1000",
              isLateNight
                ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                : "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50",
            )}
          >
            <div className="flex items-center gap-2">
              <FiClock
                style={{
                  color: isLateNight ? "#F59E0B" : config?.primaryColor,
                }}
                size={16}
              />
              <span
                className={clsx(
                  "text-base font-mono font-black tracking-tighter transition-colors duration-1000",
                  isLateNight
                    ? "text-amber-500"
                    : "text-zinc-900 dark:text-zinc-100",
                )}
              >
                {timeString}
              </span>
            </div>
            <div className="hidden xl:block w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700" />
            <span className="hidden xl:block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">
              {dateString}
            </span>
          </div>

          {/* Theme Switcher */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
            {[
              { id: "light", icon: <FiSun size={14} /> },
              { id: "dark", icon: <FiMoon size={14} /> },
              { id: "system", icon: <FiMonitor size={14} /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={clsx(
                  "p-1.5 md:p-2 rounded-md transition-all duration-300",
                  theme === t.id
                    ? "bg-white dark:bg-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200",
                )}
                style={{
                  color: theme === t.id ? config?.primaryColor : undefined,
                }}
              >
                {t.icon}
              </button>
            ))}
          </div>

          {/* Option 1: The "Power Avatar" Logout Button */}
          <div className="flex items-center gap-3 ml-2 border-l border-zinc-200 dark:border-zinc-800 pl-4 md:pl-6">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span
                className="text-[9px] font-black uppercase tracking-[0.2em]"
                style={{ color: config?.primaryColor }}
              >
                Admin
              </span>
              <span className="text-[10px] font-bold text-zinc-400">
                {current?.email?.length > 15
                  ? `${current.email.substring(0, 12)}...`
                  : current?.email}
              </span>
            </div>

            <button
              onClick={confirmLogout} // In-update mula sa logout patungong confirmLogout
              disabled={loading}
              title="Click to Logout"
              className="group relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl md:rounded-2xl shadow-lg transition-all active:scale-90 disabled:opacity-50 overflow-hidden"
              style={{
                backgroundColor: config?.accentColor || config?.primaryColor,
                boxShadow: `0 10px 20px -5px ${config?.accentColor || config?.primaryColor}60`,
              }}
            >
              {/* Initials - Visible by default, hidden on hover */}
              <span className="group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <FiLogOut className="text-primary" size={20} />
              </span>

              {/* Logout Icon Overlay - Visible only on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-all duration-300">
                <FiLogOut
                  className="text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                  size={20}
                />
              </div>

              {/* Shimmer Effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
            </button>
          </div>
        </div>
      </div>

      {/* --- FULL PAGE LOGOUT OVERLAY --- */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-zinc-200 dark:border-zinc-800 rounded-full" />
                <motion.div
                  className="absolute inset-0 border-4 border-t-transparent rounded-full"
                  style={{ borderTopColor: config?.primaryColor }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-800 dark:text-zinc-100">
                  Signing Out
                </p>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  Securing your clinic data...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
}

export default TopBar;
