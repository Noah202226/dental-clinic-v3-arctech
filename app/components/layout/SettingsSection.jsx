"use client";

import { useState } from "react";
import {
  FiUser,
  FiCalendar,
  FiBriefcase,
  FiMoon,
  FiSun,
  FiMonitor,
  FiDroplet,
  FiType,
  FiSave,
} from "react-icons/fi";
import { useTheme } from "next-themes";
import clsx from "clsx";
import PersonalizationSettings from "../helper/PersonalizationSettings";
import ServicesTab from "../helper/ServicesTab";
import ClinicScheduleSettings from "./ClinicScheduleSettings";
import { useBranding } from "../context/BrandingProvider";
import { notify } from "@/app/lib/notify";
import { databases } from "@/app/lib/appwrite";

export default function SettingsSection() {
  const { config, setConfig, applyTheme } = useBranding();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("Personalization");
  const [isSaving, setIsSaving] = useState(false);

  // 3. Handle live preview
  // This function is the "bridge" to the rest of the app
  const updateBrandingPreview = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);

    // This is the magic part: it updates the CSS variables in the <html> tag
    // which affects every component using 'var(--theme-color)' or 'font-sans'
    applyTheme(newConfig.accentColor, newConfig.fontFamily);
  };

  // 4. Save to Appwrite
  const handleSaveBranding = async () => {
    if (!config?.$id) {
      notify.error("Settings ID not found. Please refresh.");
      return;
    }

    try {
      setIsSaving(true);
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID,
        "personalization",
        config.$id, // Use the ID loaded from BrandingProvider
        {
          accentColor: config.accentColor,
          fontFamily: config.fontFamily,
          businessName: config.businessName, // Keep existing clinic name
        },
      );
      notify.success("Clinic branding updated!");
    } catch (error) {
      notify.error("Failed to save to cloud.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // New State for Personalization (You would ideally sync this with Appwrite/Localstorage)
  const [accentColor, setAccentColor] = useState("emerald");
  const [fontFamily, setFontFamily] = useState("Sans");

  const tabs = [
    { id: "Personalization", label: "Branding", icon: <FiUser size={16} /> },
    { id: "Services", label: "Services", icon: <FiBriefcase size={16} /> },
    { id: "ClinicSchedule", label: "Schedule", icon: <FiCalendar size={16} /> },
  ];

  const colors = [
    { id: "emerald", class: "bg-emerald-500", label: "Clinical Emerald" },
    { id: "blue", class: "bg-blue-500", label: "Oceanic Blue" },
    { id: "rose", class: "bg-rose-500", label: "Medical Rose" },
    { id: "indigo", class: "bg-indigo-500", label: "Modern Indigo" },
    { id: "gold", class: "bg-amber-500", label: "Royal Gold" }, // New
    { id: "yellow", class: "bg-yellow-400", label: "Bright Sun" }, // New
    { id: "lightYellow", class: "bg-yellow-200", label: "Soft Lemon" }, // New
    { id: "zinc", class: "bg-zinc-800 dark:bg-zinc-200", label: "Monochrome" },
  ];

  const fonts = [
    { id: "Sans", label: "Inter Sans", description: "Modern & Clean" },
    { id: "Mono", label: "JetBrains Mono", description: "Technical & Precise" },
    { id: "Serif", label: "Source Serif", description: "Elegant & Classic" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          System Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Configure your clinic's digital identity, operational hours, and
          service menu.
        </p>
      </div>

      {/* Modern Pill Tab Bar */}
      <div className="inline-flex p-1.5 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl transition-all duration-300",
              activeTab === tab.id
                ? "bg-white dark:bg-zinc-800 text-primary shadow-md shadow-black/5 dark:shadow-none border border-zinc-200 dark:border-zinc-700"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-sm overflow-hidden">
        <div className="p-6 lg:p-10">
          {activeTab === "Personalization" && (
            <div className="space-y-12">
              <section className="animate-in fade-in duration-500">
                <PersonalizationSettings />
              </section>

              {/* Interface Appearance Section */}
              <section className="pt-10 border-t border-zinc-100 dark:border-zinc-800">
                <div className="mb-6 flex items-center gap-2">
                  <FiMonitor className="text-zinc-400" />
                  <div>
                    <h3 className="text-xl font-black text-foreground">
                      Interface Appearance
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Choose how you want the dashboard to look on your device.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AppearanceCard
                    label="Light Mode"
                    description="Clean & High Contrast"
                    icon={<FiSun className="text-orange-500" />}
                    active={theme === "light"}
                    onClick={() => setTheme("light")}
                    previewBg="bg-zinc-50"
                  />
                  <AppearanceCard
                    label="Dark Mode"
                    description="Easy on the eyes"
                    icon={<FiMoon className="text-indigo-400" />}
                    active={theme === "dark"}
                    onClick={() => setTheme("dark")}
                    previewBg="bg-zinc-950"
                  />
                  <AppearanceCard
                    label="System"
                    description="Sync with device"
                    icon={<FiMonitor className="text-emerald-500" />}
                    active={theme === "system"}
                    onClick={() => setTheme("system")}
                    previewBg="bg-gradient-to-br from-zinc-50 via-zinc-400 to-zinc-950"
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === "Services" && <ServicesTab />}
          {activeTab === "ClinicSchedule" && <ClinicScheduleSettings />}
        </div>
      </div>
    </div>
  );
}

// Internal Helper Component for Theme Cards
function AppearanceCard({
  label,
  description,
  icon,
  active,
  onClick,
  previewBg,
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group flex flex-col gap-4 p-5 rounded-[24px] border-2 transition-all text-left relative overflow-hidden",
        active
          ? "border-primary bg-primary/5 ring-4 ring-primary/5"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30",
      )}
    >
      {/* Mock Interface Preview */}
      <div
        className={clsx(
          "w-full h-24 rounded-xl border border-zinc-200 dark:border-zinc-700 p-2",
          previewBg,
        )}
      >
        <div className="flex gap-1 mb-2">
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-2/3 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
          <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-2 w-1/2 bg-zinc-200 dark:border-zinc-800 rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-foreground">
              {label}
            </span>
            {icon}
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {description}
          </span>
        </div>

        {/* Custom Radio Circle */}
        <div
          className={clsx(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
            active
              ? "border-primary bg-primary"
              : "border-zinc-300 dark:border-zinc-700",
          )}
        >
          {active && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      </div>

      {/* Subtle Active Glow */}
      {active && (
        <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary/10 blur-2xl rounded-full" />
      )}
    </button>
  );
}
