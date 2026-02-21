"use client";

import { useState } from "react";
import { Mail, Lock, Loader2, ArrowRight, User } from "lucide-react";
import { useBranding } from "@/app/components/context/BrandingProvider"; // 1. Inimport ang Branding Context

export default function AuthForm({ handleSubmit, submitType, onToggle }) {
  const [loading, setLoading] = useState(false);
  const { config } = useBranding(); // 2. Access sa clinic branding

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = submitType === "Sign Up" || submitType === "Create Account";

  // Reusable Input Component
  const FormInput = ({ icon: Icon, label, ...props }) => (
    <div className="space-y-2">
      <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.15em] ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {/* Ginawang 'text-primary' ang icon focus */}
          <Icon className="h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors duration-300" />
        </div>
        <input
          {...props}
          className="block w-full pl-11 pr-4 py-4 bg-zinc-100/50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50 text-zinc-900 dark:text-zinc-100 text-sm rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 font-medium">
            {isSignUp
              ? `Join ${config?.name || "us"} for a better dental experience.`
              : "Enter your credentials to continue."}
          </p>
        </div>

        {isSignUp && (
          <FormInput
            icon={User}
            label="Full Name"
            type="text"
            name="name"
            required={isSignUp}
            placeholder="John Doe"
          />
        )}

        <FormInput
          icon={Mail}
          label="Email Address"
          type="email"
          name="email"
          required
          placeholder="name@example.com"
        />

        <FormInput
          icon={Lock}
          label="Password"
          type="password"
          name="password"
          required
          placeholder="••••••••"
        />

        {/* Submit Button gamit ang Brand Primary Color */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full flex items-center justify-center gap-2 bg-primary hover:opacity-90 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all active:scale-[0.97] group overflow-hidden mt-2"
          style={{
            backgroundColor: !loading ? config?.primaryColor : undefined,
            boxShadow: !loading
              ? `0 20px 25px -5px ${config?.primaryColor}33`
              : "none",
          }}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span className="relative z-10">{submitType}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
        </button>

        <div className="pt-2 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {isSignUp ? "Already have an account?" : "New patient?"}{" "}
            <button
              type="button"
              onClick={onToggle}
              className="text-primary font-bold hover:underline underline-offset-4 transition-colors"
            >
              {isSignUp ? "Log In" : "Sign Up Now"}
            </button>
          </p>
        </div>
      </form>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
