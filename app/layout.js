import "./globals.css";
import { Montserrat } from "next/font/google";
import { Providers } from "./providers"; // Import the new client wrapper
import InstallBanner from "./components/InstallBanner";
import { Toaster } from "react-hot-toast";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

// ✅ Metadata is now safe here because this is a Server Component
const APP_NAME = "Arc Tech Dental Clinic v3 Demo";
const APP_DEFAULT_TITLE = "Arc Tech Dental Clinic v3 Demo ";
const APP_TITLE_TEMPLATE = "%s - PWA App";
const APP_DESCRIPTION = "Best PWA app in the world!";

export const metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.className} transition-colors duration-300`}
      >
        {/* Wrap content in the Client Provider */}
        <Providers>
          <main className="min-h-screen relative">
            {children}

            <InstallBanner />

            {/* Background Image Overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none -z-10"
              style={{
                backgroundImage: "url('/alipio-dental-logo.png')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "600px",
              }}
            ></div>
          </main>
        </Providers>

        <Toaster
          position="top-right"
          // Force the toaster container to stay above ALL modals
          containerStyle={{
            zIndex: 99999,
          }}
          toastOptions={{
            className: "font-bold tracking-tight",
            duration: 4000,
            style: {
              background: "var(--toast-bg)",
              color: "var(--toast-color)",
              border: "1px solid var(--toast-border)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              borderRadius: "20px",
              padding: "16px 24px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
