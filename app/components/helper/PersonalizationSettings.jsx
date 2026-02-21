"use client";

import { useState } from "react";
import {
  Loader2,
  Save,
  Layout,
  Building2,
  Fingerprint,
  CheckCircle2,
  Sparkles,
  Droplet,
} from "lucide-react";
import clsx from "clsx";
import { notify } from "@/app/lib/notify";
import { useBranding } from "../context/BrandingProvider";
import { databases } from "@/app/lib/appwrite";

export default function PersonalizationSettings() {
  const { config, setConfig, applyTheme } = useBranding();
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    { id: "emerald", class: "bg-emerald-500", label: "Clinical" },
    { id: "blue", class: "bg-blue-500", label: "Oceanic" },
    { id: "rose", class: "bg-rose-500", label: "Medical" },
    { id: "indigo", class: "bg-indigo-500", label: "Modern" },
    { id: "gold", class: "bg-amber-500", label: "Royal" },
    { id: "yellow", class: "bg-yellow-400", label: "Bright" },
    { id: "lightYellow", class: "bg-yellow-200", label: "Soft" },
    { id: "zinc", class: "bg-zinc-800 dark:bg-zinc-200", label: "Mono" },
  ];

  const updatePreview = (key, value) => {
    if (!config) return;

    // We spread the existing config so that $id and other fields are preserved
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);

    if (key === "accentColor") {
      applyTheme(value, config.fontFamily);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for the Document ID ($id) which comes from Appwrite
    if (!config?.$id) {
      notify.error("Branding data not fully loaded from server.");
      return;
    }

    try {
      setIsSaving(true);
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID,
        "personalization",
        config.$id,
        {
          businessName: config.businessName || "",
          initial: config.initial || "",
          accentColor: config.accentColor || "emerald",
          fontFamily: config.fontFamily || "Sans",
        },
      );
      notify.success("Brand Identity Updated!");
    } catch (error) {
      notify.error("Failed to sync with cloud.");
      console.error("Appwrite Update Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Better Loading State
  if (!config || !config.accentColor) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-300" />
        <p className="text-zinc-500 font-bold animate-pulse">
          Initializing Brand Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="xl:col-span-2 space-y-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="text-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Clinic Identity & Style
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Update your clinic name and brand color to match your office vibe.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-2 group">
              <label className="flex items-center gap-2 text-[11px] uppercase font-black text-zinc-400 tracking-widest ml-1">
                <Building2 size={14} /> Business Name
              </label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-zinc-900 dark:text-zinc-100"
                value={config.businessName || ""}
                onChange={(e) =>
                  updatePreview("businessName", e.target.value.toUpperCase())
                }
                required
              />
            </div>

            <div className="md:col-span-1 space-y-2 group">
              <label className="flex items-center justify-center gap-2 text-[11px] uppercase font-black text-zinc-400 tracking-widest">
                <Fingerprint size={14} /> ID
              </label>
              <input
                type="text"
                maxLength={2}
                className="w-full px-5 py-4 bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-center font-black text-zinc-900 dark:text-zinc-100"
                value={config.initial || ""}
                onChange={(e) =>
                  updatePreview("initial", e.target.value.toUpperCase())
                }
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[11px] uppercase font-black text-zinc-400 tracking-widest ml-1">
              <Droplet size={14} /> Accent Color
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => updatePreview("accentColor", color.id)}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all",
                    config.accentColor === color.id
                      ? "border-zinc-900 dark:border-white bg-white dark:bg-zinc-800 shadow-lg"
                      : "border-transparent bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800",
                  )}
                >
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full shrink-0",
                      color.class,
                    )}
                  />
                  <span className="text-xs font-black truncate text-zinc-700 dark:text-zinc-300">
                    {color.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 font-black px-10 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Save size={18} />
            )}
            Save Brand Identity
          </button>
        </form>
      </div>

      <div className="xl:col-span-1 sticky top-6">
        {/* Preview Section - NOW DYNAMIC */}
        <div className="xl:col-span-1 sticky top-6">
          <div className="relative p-6 bg-zinc-50 dark:bg-zinc-900/40 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-[10px] font-black uppercase text-zinc-400 mb-6 tracking-widest text-center">
              Live Brand Preview
            </p>

            {/* The Sidebar/Header Preview */}
            <div className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
              {/* Logo box uses the dynamic primary color */}
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/30 transition-colors duration-500">
                {config.initial || "—"}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="h-2 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-2" />
                <p className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-none truncate tracking-tight">
                  {config.businessName || "CLINIC NAME"}
                </p>
              </div>
              <Layout className="text-zinc-200 dark:text-zinc-800" size={24} />
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase">
                <CheckCircle2 size={12} /> Syncing to {config.accentColor}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
