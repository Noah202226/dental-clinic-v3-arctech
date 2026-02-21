"use client";

import { useEffect, useState } from "react";
import Features from "./components/landing/Features";
import Hero from "./components/landing/Hero";

import { useAuthStore } from "./stores/authStore";
import DashboardPage from "./components/Dashboard";

export default function HomePage() {
  const { getCurrentUser, current, loading } = useAuthStore((state) => state);

  const [factIndex, setFactIndex] = useState(0);

  const dentalFacts = [
    "Tooth enamel is the hardest substance in the human body.",
    "Like fingerprints, everyone has a unique set of teeth and tongue print.",
    "If you're right-handed, you tend to chew your food on your right side.",
    "The average person spends about 38.5 days brushing their teeth in a lifetime.",
    "Teeth are the only part of the human body that can't repair itself.",
    "Humans have two sets of teeth, while sharks have about 40 sets!",
  ];

  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % dentalFacts.length);
      }, 5000); // Change fact every 3 seconds
      return () => clearInterval(timer);
    }
  }, [loading]);

  // Fetch user on mount
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 z-50">
        <div className="relative mb-8">
          {/* Tooth Hero SVG */}
          <div className="relative animate-bounce duration-1000">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              className="text-zinc-900 dark:text-white drop-shadow-2xl"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Cape */}
              <path
                d="M12 4c-4 0-7 2-8 5l-2 8c4-1 6-1 10 0s6 1 10 0l-2-8c-1-3-4-5-8-5z"
                fill="#ef4444"
                className="animate-pulse"
              />
              {/* Body */}
              <path
                d="M4.14 11.46C3.41 12.19 3 13.19 3 14.28C3 16.5 4.8 18.3 7.02 18.3C8.42 18.3 9.7 17.59 10.45 16.51L12 14.28L13.55 16.51C14.3 17.59 15.58 18.3 16.98 18.3C19.2 18.3 21 16.5 21 14.28C21 13.19 20.59 12.19 19.86 11.46L12 3.6L4.14 11.46Z"
                fill="currentColor"
              />
              {/* Mask */}
              <path d="M6 11h12v2H6z" fill="#18181b" className="opacity-90" />
              <circle cx="9" cy="12" r="0.5" fill="white" />
              <circle cx="15" cy="12" r="0.5" fill="white" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative rounded-full h-4 w-4 bg-blue-500"></span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-72 text-center">
          <div className="flex flex-col items-center gap-1">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-900 dark:text-white">
              Arc Tech Demo <span className="text-red-500 italic">Clinic</span>
            </p>
            <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-red-500 animate-[progress_2s_ease-in-out_infinite] w-1/2 rounded-full" />
            </div>
          </div>

          {/* Dynamic Dental Facts Area */}
          <div className="h-12 flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Did you know?
            </p>
            <p
              key={factIndex} // Changing key triggers a re-render for animation
              className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 animate-in fade-in slide-in-from-bottom-2 duration-700"
            >
              "{dentalFacts[factIndex]}"
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes progress {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(200%);
            }
          }
        `}</style>
      </div>
    );
  }

  // If logged in → show dashboard
  if (current) {
    return <DashboardPage user={current} />;
  }

  // Else → show landing page
  return (
    <>
      <Hero />
    </>
  );
}
