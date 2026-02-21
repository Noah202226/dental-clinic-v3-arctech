"use client";

import { useEffect, useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-card border border-primary/20 p-4 rounded-2xl shadow-2xl shadow-primary/10 max-w-sm flex flex-col gap-3 backdrop-blur-md">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <FiDownload size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Install App</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Get the best experience and have desktop shortcut.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-zinc-400 hover:text-foreground transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        <button
          onClick={handleInstallClick}
          className="btn bg-primary hover:bg-primary/90 text-primary-content w-full rounded-xl border-none shadow-lg shadow-primary/20 font-bold text-sm"
        >
          Add to Home Screen
        </button>
      </div>
    </div>
  );
}
