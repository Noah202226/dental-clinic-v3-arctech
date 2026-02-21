"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import AuthForm from "../AuthForm";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/stores/authStore";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useBranding } from "../context/BrandingProvider"; // 1. Added Branding Context
import {
  Facebook,
  Clock,
  Layers,
  Rocket,
  Moon,
  Sun,
  Sparkles,
  ShieldCheck,
  Zap,
  Map,
  Contact,
} from "lucide-react";

export default function Hero() {
  const { config } = useBranding(); // 2. Access clinic branding data
  const { login, register, getCurrentUser } = useAuthStore((state) => state);
  const [isSignUp, setIsSignUp] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const user = await login(form.get("email"), form.get("password"));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const user = await register(form.get("email"), form.get("password"));
  };

  // Helper to safely use primary color with opacity
  const primaryWithOpacity = (opacity) =>
    `${config?.primaryColor || "#10B981"}${opacity}`;

  return (
    <section className="relative min-h-screen flex flex-col items-center bg-slate-50 dark:bg-[#09090b] transition-colors duration-500 overflow-hidden">
      {/* 1. Tech Stack / Feature Bar */}
      <div className="w-full bg-zinc-900 dark:bg-zinc-950/40 backdrop-blur-md text-zinc-400 py-3 px-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] flex flex-wrap justify-center gap-x-8 gap-y-2 z-20 border-b border-white/5">
        {[
          "General Dentistry",
          "Cosmetic Dentistry",
          "Orthodontics",
          "Oral Surgery",
          "Dental Braces",
          "Prosthodontics",
        ].map((service) => (
          <span
            key={service}
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <Zap size={12} className="text-primary" />
            {service}
          </span>
        ))}
      </div>

      {/* Theme Switcher */}
      <div className="absolute top-20 right-6 z-50">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 hover:scale-110 transition-all active:scale-95"
        >
          {theme === "dark" ? (
            <Sun size={20} className="text-yellow-400" />
          ) : (
            <Moon size={20} className="text-primary" />
          )}
        </button>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-12 items-center w-full max-w-7xl px-6 md:px-12 py-12 lg:py-20 z-10 gap-16">
        {/* Left: Branding */}
        <div className="lg:col-span-7 flex flex-col text-center lg:text-left space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center self-center lg:self-start gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold ring-1 ring-primary/20"
          >
            <Sparkles size={14} />
            {config?.softwareTagline || "Dental clinic software made easy"}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
              {/* Dynamic Logo Implementation */}
              {config?.logoUrl && (
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  className="relative w-20 h-20 md:w-28 md:h-28 shrink-0"
                >
                  <Image
                    src={config.logoUrl}
                    alt="Clinic Logo"
                    fill
                    className="object-contain filter drop-shadow-xl"
                    priority
                  />
                </motion.div>
              )}

              <div>
                <h1
                  className="text-5xl md:text-8xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter leading-[0.85]"
                  style={{ fontFamily: config?.fontFamily || "inherit" }}
                >
                  {config?.name?.split(" ").map((word, i) => (
                    <span
                      key={i}
                      className={i === 0 ? "block" : "text-primary mr-2"}
                    >
                      {word}{" "}
                    </span>
                  )) || "Manila Dental Arts"}
                </h1>
              </div>
            </div>

            <p className="text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed italic">
              “{config?.slogan || "Where smile speaks louder than words"}”
            </p>
          </motion.div>

          {/* Action Area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <a
              href="https://appointment-manila-dental-arts-v3.vercel.app/"
              target="_blank"
              className="group flex items-center gap-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-5 rounded-full text-lg font-bold shadow-2xl hover:bg-primary dark:hover:bg-primary hover:text-white transition-all hover:-translate-y-1"
            >
              <Rocket size={24} />
              Visit our Appointment Portal
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </a>
            <a
              href="https://www.facebook.com/manila.arts.1"
              target="_blank"
              className="flex items-center gap-2 text-zinc-500 hover:text-primary font-bold transition-colors"
            >
              <Facebook size={20} />
              Follow Us
            </a>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Map />,
                label: "Location",
                val:
                  config?.address ||
                  "U201 - 51 Xavierville Avenue Loyola Heights Quezon City",
              },
              {
                icon: <Contact />,
                label: "Contact",
                val: `${config?.email || "maniladentalarts@gmail.com"} | ${config?.phone || "09055169516"}`,
              },
            ].map((info, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
              >
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  {info.icon}
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
                    {info.label}
                  </p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {info.val}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
          {/* Dynamic Glow using the primary color */}
          <div
            className="absolute -inset-20 blur-[100px] rounded-full"
            style={{
              backgroundColor: `${config?.accentColor || "#10B981"}33`,
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "login"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-8 rounded-[3rem] border border-primary/40 dark:border-zinc-800 shadow-2xl"
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 rounded-b-full"
                style={{ backgroundColor: config?.accentColor || "red" }}
              />
              <AuthForm
                handleSubmit={isSignUp ? handleRegister : handleLogin}
                submitType={isSignUp ? "Sign Up" : "Log In"}
                onToggle={() => setIsSignUp(!isSignUp)}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
