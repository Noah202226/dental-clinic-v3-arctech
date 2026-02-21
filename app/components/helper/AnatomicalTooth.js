import React from "react";

// --- Placeholder/Example SVG Path Data ---
// In a real application, this map would contain the actual path data
// (the 'd' attribute) for the 32 tooth shapes to match your image.
const TOOTH_SHAPE_MAP = {
  // 1st Molar (looks complex/squarish)
  16: "M 30 10 L 70 10 L 80 50 L 70 90 L 30 90 L 20 50 Z",
  46: "M 30 10 L 70 10 L 80 50 L 70 90 L 30 90 L 20 50 Z",
  // Canine (looks pointy)
  13: "M 50 10 L 90 90 L 10 90 Z",
  43: "M 50 90 L 90 10 L 10 10 Z",
  // Incisor (looks rectangular/flat)
  11: "M 30 10 L 70 10 L 70 90 L 30 90 Z",
  41: "M 30 90 L 70 90 L 70 10 L 30 10 Z",
  // ... add all 32 tooth paths here ...
};

const getToothPath = (number) => {
  // Use the actual path if available, otherwise a simple placeholder
  return TOOTH_SHAPE_MAP[number] || "M 20 20 L 80 20 L 80 80 L 20 80 Z";
};
// ----------------------------------------

export default function AnatomicalTooth({
  status,
  hasNote,
  toothNumber,
  onClick,
}) {
  const isUpper = toothNumber < 30;

  // 1. Determine base colors based on status
  let fillColor = "white";
  let statusStrokeColor = "currentColor"; // Will use Tailwind color

  if (status === "caries") {
    fillColor = "#FCA5A5"; // Red for caries
    statusStrokeColor = "#DC2626"; // Darker red
  } else if (status === "filled") {
    fillColor = "#FEF08A"; // Yellow for filled
    statusStrokeColor = "#EAB308"; // Darker yellow
  } else {
    fillColor = "#E5E7EB"; // Light background for healthy
    statusStrokeColor = "#00A388"; // Teal/Mint for healthy border
  }

  // 2. Determine Note Color (Thick blue ring)
  const noteStrokeClass = hasNote ? "ring-2 ring-blue-500" : "";

  // Get the specific SVG path
  const pathData = getToothPath(String(toothNumber));

  return (
    <button
      onClick={onClick}
      // Button wrapper to hold the tooth shape
      className={`flex flex-col items-center justify-center h-16 w-full p-0 border-0 bg-transparent relative hover:bg-gray-100 transition-colors ${noteStrokeClass} rounded-lg`}
      style={{
        // Adjust position for upper/lower teeth if necessary for alignment
        paddingTop: isUpper ? "4px" : "0",
        paddingBottom: isUpper ? "0" : "4px",
      }}
    >
      <svg viewBox="0 0 100 100" className="w-8 h-8 md:w-10 md:h-10">
        <path
          d={pathData}
          fill={fillColor}
          stroke={statusStrokeColor}
          strokeWidth="3"
          className="transition-all duration-200"
        />
      </svg>
      <span
        className={`absolute text-xs font-semibold ${
          isUpper ? "top-1" : "bottom-1"
        } text-gray-800 pointer-events-none`}
      >
        {toothNumber}
      </span>
    </button>
  );
}
