"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { databases } from "@/app/lib/appwrite";

const BrandingContext = createContext();

export function BrandingProvider({ children }) {
  const [config, setConfig] = useState({
    accentColor: "emerald",
    fontFamily: "Sans",
    businessName: "",
  });

  const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
  const COLLECTION_ID = "personalization";

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
        if (res.documents.length > 0) {
          const data = res.documents[0];

          const newConfig = {
            $id: data.$id, // CRITICAL: Store the Appwrite ID here
            accentColor: data.accentColor || "emerald",
            fontFamily: data.fontFamily || "Sans",
            businessName: data.businessName || "",
            initial: data.initial || "", // Add this to keep track of initials
          };

          setConfig(newConfig);
          applyTheme(newConfig.accentColor, newConfig.fontFamily);
        }
      } catch (err) {
        console.error("Branding load error:", err);
      }
    };
    loadBranding();
  }, []);

  const applyTheme = (color, font) => {
    const root = document.documentElement;

    const colorMap = {
      emerald: "#10b981",
      blue: "#3b82f6",
      rose: "#f43f5e",
      indigo: "#6366f1",
      gold: "#d97706", // Amber 600 for better contrast
      yellow: "#facc15", // Yellow 400
      lightYellow: "#fef08a", // Yellow 200
      zinc: "#71717a",
    };

    if (colorMap[color]) {
      root.style.setProperty("--theme-color", colorMap[color]);
      // Create the hover variant (87% opacity)
      root.style.setProperty("--theme-hover", `${colorMap[color]}de`);
    }

    root.setAttribute("data-font", font);
  };

  return (
    <BrandingContext.Provider value={{ config, setConfig, applyTheme }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
