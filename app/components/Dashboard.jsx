"use client";

import { useEffect, useState } from "react";
import { FiUsers, FiSettings, FiBarChart2, FiList } from "react-icons/fi";
import { ListChecks, LayoutDashboard, ChevronLeft } from "lucide-react";
import TopBar from "./layout/TopBar";
import DashboardSection from "./layout/DashboardSection";
import PatientsSection from "./layout/PatientsSection";
import ReportsSection from "./layout/ReportsSection";
import SettingsSection from "./layout/SettingsSection";
import SchedulingSection from "./layout/ScheduleSections";
import AppointmentManager from "./layout/Appointments";
import { usePersonalizationStore } from "../stores/usePersonalizationStore";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("patients");
  const { personalization, fetchPersonalization } = usePersonalizationStore();

  const [isReportsUnlocked, setIsReportsUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD; // Or get this from personalization store

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsReportsUnlocked(true);
      setShowPasswordModal(false);
      setActiveSection("reports");
      setPasswordInput("");
      closeDrawer();
    } else {
      // You could use your 'notify' library here
      alert("Incorrect Password");
      setPasswordInput("");
    }
  };

  useEffect(() => {
    fetchPersonalization();
  }, [fetchPersonalization]);

  const mockStats = {
    totalPatients: 1245,
    newPatients: 23,
    activeTreatments: 87,
    revenueMonth: 452000,
    revenueGrowth: 8,
    outstandingBalance: 35700,
  };

  const mockTopServices = [
    { name: "Teeth Cleaning", count: 320 },
    { name: "Braces", count: 150 },
    { name: "Tooth Extraction", count: 110 },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardSection stats={mockStats} topServices={mockTopServices} />
        );
      case "scheduling":
        return <SchedulingSection />;
      case "appointments":
        return <AppointmentManager />;
      case "patients":
        return <PatientsSection />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <DashboardSection />;
    }
  };

  // V3 Nav Styling - Now strictly using CSS variables from your globals.css
  const getLinkClasses = (section) => {
    const isActive = activeSection === section;
    return `group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 relative ${
      isActive
        ? "bg-primary/15 text-primary font-bold shadow-sm"
        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-foreground"
    }`;
  };

  const closeDrawer = () => {
    const drawer = document.getElementById("dashboard-drawer");
    if (drawer) drawer.checked = false;
  };

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-background text-foreground transition-colors duration-500">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main content Area */}
      <div className="drawer-content flex flex-col relative bg-background">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-[1600px] mx-auto"
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Sidebar Navigation */}
      <div className="drawer-side z-50">
        <label htmlFor="dashboard-drawer" className="drawer-overlay"></label>

        {/* Update: The aside now uses bg-card (white in light, zinc-900 in dark) 
            to stand out against the slightly softer bg-background.
        */}
        <aside className="w-72 min-h-screen bg-card border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-500 ease-in-out shadow-xl lg:shadow-none">
          {/* Logo Section */}
          <div className="p-6 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 group">
                {/* Avatar adapts to your --theme-color */}
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-content font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                  {personalization?.initial || "CA"}
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tighter text-foreground leading-none">
                    {personalization?.businessName || "Clinic Admin"}
                  </h2>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    v3.0 Pro
                  </span>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          </div>

          {/* Sidebar Menu Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 space-y-8 py-4 custom-scrollbar">
            {/* Group: Analytics */}
            {/* <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3">
                Analytics
              </p>
              <ul className="space-y-1">
                <NavItem
                  icon={<LayoutDashboard size={18} />}
                  label="Dashboard"
                  id="dashboard"
                  activeSection={activeSection}
                  onClick={() => {
                    setActiveSection("dashboard");
                    closeDrawer();
                  }}
                  getLinkClasses={getLinkClasses}
                />
              </ul>
            </div> */}

            {/* Group: Management */}
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3">
                Management
              </p>
              <ul className="space-y-1">
                <NavItem
                  icon={<FiUsers size={18} />}
                  label="Patients"
                  id="patients"
                  activeSection={activeSection}
                  onClick={() => {
                    setActiveSection("patients");
                    closeDrawer();
                    setIsReportsUnlocked(false);
                  }}
                  getLinkClasses={getLinkClasses}
                />
                <NavItem
                  icon={<FiList size={18} />}
                  label="Task Monitoring"
                  id="scheduling"
                  activeSection={activeSection}
                  onClick={() => {
                    setActiveSection("scheduling");
                    closeDrawer();
                    setIsReportsUnlocked(false);
                  }}
                  getLinkClasses={getLinkClasses}
                />
                <NavItem
                  icon={<ListChecks size={18} />}
                  label="Appointments"
                  id="appointments"
                  activeSection={activeSection}
                  onClick={() => {
                    setActiveSection("appointments");
                    closeDrawer();
                    setIsReportsUnlocked(false);
                  }}
                  getLinkClasses={getLinkClasses}
                />
              </ul>
            </div>

            {/* Group: Intelligence */}
            <div className="animate-in fade-in slide-in-from-left-4 duration-1000">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3">
                PERFORMANCE
              </p>
              <ul className="space-y-1">
                <NavItem
                  icon={<FiBarChart2 size={18} />}
                  label="Sales & Expenses"
                  id="reports"
                  activeSection={activeSection}
                  onClick={() => {
                    if (!isReportsUnlocked) {
                      setShowPasswordModal(true); // Open modal instead of switching
                    } else {
                      setActiveSection("reports");
                      closeDrawer();
                    }
                  }}
                  getLinkClasses={getLinkClasses}
                />
              </ul>
            </div>
          </div>

          {/* Bottom Settings Link */}
          <div className="p-4 mt-auto border-t border-zinc-100 dark:border-zinc-800/50">
            <a
              className={getLinkClasses("settings")}
              onClick={() => {
                setActiveSection("settings");
                closeDrawer();
                setIsReportsUnlocked(false);
              }}
            >
              <FiSettings
                size={18}
                className={
                  activeSection === "settings"
                    ? "text-primary animate-spin-slow"
                    : "text-zinc-400 group-hover:text-primary transition-colors"
                }
              />
              <span className="font-bold">System Settings</span>
            </a>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiSettings size={32} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black mb-2">Admin Access Required</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Please enter the administrator password to view financial
                reports.
              </p>

              <input
                type="password"
                autoFocus
                name="auto"
                autoComplete="secure-password"
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-primary transition-all text-center font-bold tracking-widest"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePasswordSubmit();
                }}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput("");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                >
                  Unlock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, id, activeSection, onClick, getLinkClasses }) {
  const isActive = activeSection === id;
  return (
    <li>
      <a className={getLinkClasses(id)} onClick={onClick}>
        <span
          className={
            isActive
              ? "text-primary"
              : "text-zinc-400 group-hover:text-primary transition-colors"
          }
        >
          {icon}
        </span>
        {label}
        {isActive && (
          <motion.div
            layoutId="activePill"
            className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </a>
    </li>
  );
}
