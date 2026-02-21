// src/app/login/page.js
"use client";

import AuthForm from "../components/AuthForm";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "../stores/authStore";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, register, getCurrentUser, current, loading } = useAuthStore(
    (state) => state,
  );
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const user = await login(form.get("email"), form.get("password"));
    if (user) router.push("/"); // ✅ safe navigation
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const user = await register(form.get("email"), form.get("password"));
    if (user) router.push("/"); // ✅ safe navigation
  };

  return (
    <div>
      {!loading && (
        <p>{current ? `Hello, ${current.email}` : "Not logged in"}</p>
      )}
      <div className="relative px-4 sm:px-6 lg:px-8 mt-12 md:mt-0">
        {/* Modern background glow behind form */}
        <div className="absolute -inset-4 bg-emerald-400/20 blur-3xl rounded-full opacity-50" />

        <AnimatePresence mode="wait">
          <motion.div
            key={isSignUp ? "signup" : "login"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] border border-white shadow-2xl"
          >
            <AuthForm
              handleSubmit={isSignUp ? handleRegister : handleLogin}
              submitType={isSignUp ? "Sign Up" : "Log In"}
              onToggle={() => setIsSignUp(!isSignUp)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
