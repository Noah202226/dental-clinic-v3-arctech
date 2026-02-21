"use client";

import { notify } from "@/app/lib/notify";
import { useState, useEffect, useRef } from "react";
import { FiShield, FiEye, FiEyeOff, FiLock, FiClock } from "react-icons/fi";

function ProtectedPaymentSection({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const timerRef = useRef(null);

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  const AUTO_LOCK_TIME = 10 * 60 * 1000; // 5 Minutes (Adjustable)

  // Function para i-lock ang section
  const lockSection = () => {
    setIsUnlocked(false);
    setPassword("");
    setShowPassword(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Reset timer tuwing may activity
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isUnlocked) {
      timerRef.current = setTimeout(() => {
        lockSection();
        notify.info("Section locked due to inactivity.");
      }, AUTO_LOCK_TIME);
    }
  };

  // Listen sa events para sa auto-lock reset
  useEffect(() => {
    if (isUnlocked) {
      resetTimer();
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keydown", resetTimer);
      window.addEventListener("click", resetTimer);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [isUnlocked]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsUnlocked(true);
      notify.success("Access Granted");
      setPassword("");
    } else {
      notify.error("Incorrect Password");
      setPassword("");
    }
  };

  if (isUnlocked) {
    return (
      <div className="relative group">
        {/* Lock Button with Inactivity Hint */}
        <div className="absolute -top-3 -right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-white text-[9px] font-black rounded-full shadow-xl">
            <FiClock className="animate-pulse" /> AUTO-LOCK ACTIVE
          </div>
          <button
            onClick={lockSection}
            className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-lg active:scale-95 transition-transform"
            title="Lock Now"
          >
            <FiLock size={14} />
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 bg-zinc-50/50 dark:bg-zinc-900/20 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-amber-100 dark:bg-amber-950/30 text-primary rounded-2xl">
          <FiShield size={32} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-primary dark:text-zinc-100">
            Financial Data Protected
          </h4>
          <p className="text-[12px] font-bold text-zinc-500 mt-1">
            Please enter the admin password to view payments and balances.
          </p>
        </div>

        <form
          onSubmit={handleUnlock}
          className="flex flex-col gap-2 w-full max-w-xs"
        >
          <div className="relative flex items-center">
            <input
              autoComplete="off"
              name="password-protected"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-primary/80 hover:bg-primary dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
          >
            Unlock Payment Data
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProtectedPaymentSection;
