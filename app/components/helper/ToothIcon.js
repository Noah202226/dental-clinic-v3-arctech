import { useBranding } from "../context/BrandingProvider";
import { motion } from "framer-motion";

export default function ToothIcon({
  status,
  hasNote,
  toothNumber,
  isSelected,
}) {
  const { config } = useBranding(); // Access clinic branding

  // Enhanced Anatomical SVG with Cusps and Dual Roots

  const AnatomicalToothSVG = ({ fill, stroke, opacity = 1 }) => (
    <svg
      viewBox="0 0 100 120"
      className="w-10 h-12 transition-all duration-300"
      style={{ opacity }}
    >
      {/* Modern Molar Shape with Roots */}

      <path
        d="M20 30

         Q 20 15 35 12 Q 50 15 65 12 Q 80 15 80 30

         Q 85 55 75 75

         Q 70 100 60 115 Q 50 105 40 115

         Q 30 100 25 75

         Q 15 55 20 30 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Occlusal Surface Detail (Cusps) */}

      <path
        d="M30 35 Q 50 45 70 35"
        fill="none"
        stroke={stroke}
        strokeWidth="5"
        opacity="0.3"
        strokeLinecap="round"
      />

      {/* Subtle Depth Highlight */}

      <path
        d="M30 22 Q 50 18 70 22"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );

  const statusConfig = {
    // RED = CARIES/DEFECT

    caries: { fill: "#FCA5A5", stroke: "#EF4444", label: "C" },

    recurrent_caries: { fill: "#FECACA", stroke: "#DC2626", label: "RC" },

    fractured: { fill: "#FEE2E2", stroke: "#991B1B", label: "F" },

    impacted: { fill: "#FFEDD5", stroke: "#F97316", label: "Imp" },

    unerupted: { fill: "#FFF7ED", stroke: "#FB923C", label: "Un" },

    abutment: { fill: "#FEE2E2", stroke: "#B91C1C", label: "Ab" },

    extraction: {
      fill: "#D4D4D8",

      stroke: "#18181B",

      label: "X",

      isGhosted: true,
    },

    // BLUE = RESTORATIONS

    amalgam: { fill: "#E0E7FF", stroke: "#4338CA", label: "Am" },

    composite: { fill: "#DBEAFE", stroke: "#2563EB", label: "Co" },

    glassionomer: { fill: "#CFFAFE", stroke: "#0891B2", label: "GI" },

    sealant: { fill: "#CCFBF1", stroke: "#0D9488", label: "PFS" },

    inlay: { fill: "#E0E7FF", stroke: "#6366F1", label: "In" },

    // PROSTHODONTICS & OTHERS

    apc: { fill: "#F5F3FF", stroke: "#7C3AED", label: "APC" },

    pfc: { fill: "#FAE8FF", stroke: "#C026D3", label: "PFM" },

    pfg: { fill: "#FEF3C7", stroke: "#D97706", label: "PFG" },

    gold_crown: { fill: "#FEF3C7", stroke: "#B45309", label: "GC" },

    metal_crown: { fill: "#F1F5F9", stroke: "#475569", label: "MC" },

    ss_crown: { fill: "#F8FAFC", stroke: "#64748B", label: "SS" },

    pontic: { fill: "#ECFDF5", stroke: "#059669", label: "P" },

    rpd: { fill: "#FDF2F8", stroke: "#DB2777", label: "RPD" },

    cd: { fill: "#FDF2F8", stroke: "#BE185D", label: "CD" },

    missing: {
      fill: "#F4F4F5",

      stroke: "#A1A1AA",

      label: "M",

      isGhosted: true,
    },

    // CARIES FREE

    healthy: { fill: "#FFFFFF", stroke: "#E4E4E7", label: "✓" },
  };

  const current = statusConfig[status] || statusConfig.healthy;

  // Determine the color for the small badge overlay
  const getBadgeColor = () => {
    if (status === "healthy" || !status) {
      return config?.accentColor || "#10B981"; // Use brand color, fallback to emerald
    }
    return current.stroke;
  };

  return (
    <div className="relative group flex flex-col items-center">
      {/* Tooth Numbering */}
      <span
        className={`text-[9px] font-black mb-1 transition-colors`}
        style={{
          color: isSelected ? config?.accentColor || "#10B981" : "#A1A1AA",
        }}
      >
        {toothNumber}
      </span>

      {/* Main Tooth Container */}
      <motion.div
        whileHover={{ y: -2 }}
        className={`
          relative p-2 rounded-2xl transition-all duration-300
          ${
            isSelected
              ? "bg-white dark:bg-zinc-900 ring-2 shadow-lg"
              : "bg-white dark:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
          }
        `}
        style={{
          // Dynamic ring color for selection
          boxShadow: isSelected
            ? `0 0 0 2px ${config?.accentColor || "#10B981"}`
            : "none",
        }}
      >
        <AnatomicalToothSVG
          fill={current.fill}
          stroke={current.stroke}
          opacity={current.isGhosted ? 0.3 : 1}
        />

        {/* Status Badge Overlay - This is where the Check Icon color lives */}
        {(status !== "healthy" || current.label === "✓") && (
          <div
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm z-20"
            style={{ backgroundColor: getBadgeColor() }}
          >
            <span className="text-[7px] font-black text-white leading-none uppercase">
              {current.label}
            </span>
          </div>
        )}

        {/* Note Indicator */}
        {hasNote && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <div className="w-2 h-2 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </div>
        )}

        {/* Ghosting Overlay for Missing/Extraction */}
        {current.isGhosted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[2px] bg-red-500/30 rotate-45 absolute" />
            <div className="w-full h-[2px] bg-red-500/30 -rotate-45 absolute" />
          </div>
        )}
      </motion.div>

      {/* Selection Glow using Brand Color */}
      {isSelected && (
        <motion.div
          layoutId="selectionGlow"
          className="absolute inset-0 blur-xl -z-10 rounded-full"
          style={{ backgroundColor: `${config?.accentColor || "#10B981"}20` }} // Added 20 for transparency
        />
      )}
    </div>
  );
}
