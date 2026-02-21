"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./stores/authStore";
import { useEffect, useState } from "react";
import { BrandingProvider } from "./components/context/BrandingProvider";

export function Providers({ children }) {
  const { getCurrentUser } = useAuthStore((state) => state);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getCurrentUser();
  }, [getCurrentUser]);

  // Prevent hydration mismatch by not rendering theme-dependent logic until mounted
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrandingProvider>{children}</BrandingProvider>
    </ThemeProvider>
  );
}
