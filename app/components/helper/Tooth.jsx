import React, { useState } from "react";

const Tooth = ({
  toothNumber,
  surfaces = {},
  onSurfaceClick,
  selectedSurface,
}) => {
  const [hoveredSurface, setHoveredSurface] = useState(null);

  const getSurfaceColor = (partName) => {
    const data = surfaces[partName];
    if (!data) return "white";
    const id = data.id;
    if (["caries", "recurrent_caries", "fractured"].includes(id))
      return "#ef4444"; // Red
    if (
      ["amalgam", "composite", "glassionomer", "sealant", "inlay"].includes(id)
    )
      return "#3b82f6"; // Blue
    if (
      [
        "abutment",
        "apc",
        "pfc",
        "pfg",
        "gold_crown",
        "metal_crown",
        "ss_crown",
      ].includes(id)
    )
      return "#a855f7"; // Purple
    if (["missing", "extraction"].includes(id)) return "#52525b"; // Zinc
    if (["impacted", "unerupted"].includes(id)) return "#fb923c"; // Orange
    return "#f4f4f5";
  };

  const toothStatus = Object.values(surfaces).find((s) =>
    ["missing", "extraction"].includes(s?.id),
  )?.id;
  const isSelected = (surface) =>
    selectedSurface?.tooth === toothNumber &&
    selectedSurface?.surface === surface;

  return (
    <div className="flex flex-col items-center gap-2 group relative">
      {/* MODERN TOOLTIP */}
      {hoveredSurface && surfaces[hoveredSurface]?.note && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white text-[11px] px-3 py-2 rounded-xl shadow-2xl border border-zinc-700 pointer-events-none transition-all scale-110">
          <span className="font-black text-emerald-400 mr-1">
            {hoveredSurface.toUpperCase()}:
          </span>
          {surfaces[hoveredSurface].note}
        </div>
      )}

      {/* TOOTH NUMBER LABEL */}
      <div
        className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-all ${
          selectedSurface?.tooth === toothNumber
            ? "bg-emerald-500 text-white shadow-lg scale-110"
            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
        }`}
      >
        {toothNumber}
      </div>

      {/* LARGER SVG TOOTH */}
      <div className="relative w-14 h-14 lg:w-16 lg:h-16 transition-transform hover:scale-105">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible filter drop-shadow-md"
        >
          <defs>
            <clipPath id={`clip-${toothNumber}`}>
              <circle cx="50" cy="50" r="48" />
            </clipPath>
            {/* Subtle Gradient for Modern Look */}
            <radialGradient id="surfaceGradient">
              <stop offset="70%" stopColor="currentColor" />
              <stop offset="100%" stopColor="black" stopOpacity="0.1" />
            </radialGradient>
          </defs>

          <g clipPath={`url(#clip-${toothNumber})`}>
            {["top", "right", "bottom", "left"].map((part) => (
              <path
                key={part}
                d={
                  part === "top"
                    ? "M 0 0 L 100 0 L 50 50 Z"
                    : part === "right"
                      ? "M 100 0 L 100 100 L 50 50 Z"
                      : part === "bottom"
                        ? "M 0 100 L 100 100 L 50 50 Z"
                        : "M 0 0 L 0 100 L 50 50 Z"
                }
                fill={getSurfaceColor(part)}
                stroke="#d4d4d8"
                strokeWidth={isSelected(part) ? "4" : "0.5"}
                className={`cursor-pointer transition-all ${isSelected(part) ? "stroke-emerald-500" : "hover:brightness-90"}`}
                onClick={() => onSurfaceClick(toothNumber, part)}
                onMouseEnter={() => setHoveredSurface(part)}
                onMouseLeave={() => setHoveredSurface(null)}
              />
            ))}
          </g>

          <circle
            cx="50"
            cy="50"
            r="22" // Slightly larger center
            fill={getSurfaceColor("center")}
            stroke="#d4d4d8"
            strokeWidth={isSelected("center") ? "4" : "0.5"}
            className={`cursor-pointer transition-all ${isSelected("center") ? "stroke-emerald-500" : "hover:brightness-90"}`}
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick(toothNumber, "center");
            }}
            onMouseEnter={() => setHoveredSurface("center")}
            onMouseLeave={() => setHoveredSurface(null)}
          />

          {/* INDICATORS */}
          {toothStatus === "extraction" && (
            <g className="pointer-events-none">
              <line
                x1="15"
                y1="15"
                x2="85"
                y2="85"
                stroke="#ef4444"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.9"
              />
              <line
                x1="85"
                y1="15"
                x2="15"
                y2="85"
                stroke="#ef4444"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>
          )}
          {toothStatus === "missing" && (
            <text
              x="50"
              y="68"
              textAnchor="middle"
              fontSize="55"
              fontWeight="900"
              fill="#52525b"
              opacity="0.8"
              className="pointer-events-none select-none"
            >
              M
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

export default Tooth;
