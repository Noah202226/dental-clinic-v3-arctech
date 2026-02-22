"use client";
import { useState, useMemo, useRef } from "react";
import Tooth from "./Tooth";
import { notify } from "@/app/lib/notify"; // Using your saved notify path
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";
import { useDentalChartStore } from "@/app/stores/useDentalChartStore";

export default function DentalChartSection({
  items = [],
  patientId,
  onUpdateTooth,
  patientName,
  loading,
}) {
  const { clearChart } = useDentalChartStore();
  const chartRef = useRef(null);

  const getSurfaceLabel = (toothNumber, position) => {
    const num = Number(toothNumber);

    // 1. Determine if it's Maxillary (Upper) or Mandibular (Lower)
    const isUpper = (num >= 11 && num <= 28) || (num >= 51 && num <= 65);

    // 2. Determine if it's Anterior (Front: Canine to Canine) or Posterior (Back: Molars)
    const isAnterior = [
      11, 12, 13, 21, 22, 23, 31, 32, 33, 41, 42, 43, 51, 52, 53, 61, 62, 63,
      71, 72, 73, 81, 82, 83,
    ].includes(num);

    // 3. Determine Quadrant Side (Patient's Right vs Patient's Left)
    // Patient Right: Quadrants 1, 4, 5, 8 | Patient Left: Quadrants 2, 3, 6, 7
    const isPatientRight = [1, 4, 5, 8].includes(Math.floor(num / 10));

    switch (position) {
      case "top":
        if (isUpper) return isAnterior ? "LABIAL" : "BUCCAL";
        return isAnterior ? "LINGUAL" : "LINGUAL"; // Lower internal is always Lingual
      case "bottom":
        if (isUpper) return isAnterior ? "PALATAL" : "PALATAL"; // Upper internal is Palatal
        return isAnterior ? "LABIAL" : "BUCCAL"; // Lower external
      case "left":
        return isPatientRight ? "DISTAL" : "MESIAL";
      case "right":
        return isPatientRight ? "MESIAL" : "DISTAL";
      case "center":
        return isAnterior ? "INCISAL" : "OCCLUSAL";
      default:
        return position;
    }
  };

  const handlePrint = async () => {
    if (!chartRef.current) return;

    // 1. Create a "Sandbox" container that is forced to be wide
    const sandbox = document.createElement("div");
    sandbox.style.position = "absolute";
    sandbox.style.left = "-9999px"; // Hide it off-screen
    sandbox.style.top = "0";
    sandbox.style.width = "1200px"; // Force desktop width
    document.body.appendChild(sandbox);

    // 2. Clone your chart and put it in the sandbox
    const clone = chartRef.current.cloneNode(true);
    clone.style.width = "1200px";
    clone.style.backgroundColor = "white";
    sandbox.appendChild(clone);

    try {
      // 3. Capture the sandbox version
      const dataUrl = await toPng(clone, {
        quality: 1.0,
        pixelRatio: 2,
        width: 1200,
        // We don't set height; let it calculate based on the new 1200px layout
      });

      // Cleanup: Remove sandbox immediately after capture
      document.body.removeChild(sandbox);

      // 4. Setup Landscape PDF
      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const chartMaxWidth = pageWidth - margin * 2;

      // --- HEADER ---
      pdf.setFontSize(22);
      pdf.text("DENTAL CLINICAL RECORD", pageWidth / 2, 18, {
        align: "center",
      });
      pdf.setFontSize(10);
      pdf.text(`Patient: ${patientName || "N/A"}`, margin, 28);
      pdf.text(
        `Date: ${new Date().toLocaleDateString()}`,
        pageWidth - margin,
        28,
        { align: "right" },
      );
      pdf.line(margin, 32, pageWidth - margin, 32);

      // --- ADD IMAGE ---
      const imgProps = pdf.getImageProperties(dataUrl);
      const displayWidth = chartMaxWidth;
      const displayHeight = (imgProps.height * displayWidth) / imgProps.width;

      // Position image on page 1
      pdf.addImage(dataUrl, "PNG", margin, 38, displayWidth, displayHeight);

      // --- TABLE (Automatic Page 2 if needed) ---
      const tableRows = items.map((item) => {
        const surfaces =
          typeof item.surfaces === "string"
            ? JSON.parse(item.surfaces)
            : item.surfaces;
        const findings = Object.entries(surfaces || {})
          .filter(([_, val]) => val)
          .map(([key, val]) => `${key.toUpperCase()}: ${val.abbr}`)
          .join(", ");
        return [item.toothNumber, findings, ""];
      });

      autoTable(pdf, {
        startY: 40 + displayHeight + 15,
        head: [["Tooth #", "Condition & Surfaces", "Clinical Notes"]],
        body: tableRows,
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
      });

      pdf.save(`Dental_Chart_${patientName}.pdf`);
    } catch (error) {
      console.error("Capture failed:", error);
      document.body.removeChild(sandbox); // Safety cleanup
    }
  };

  const ARCH_GROUPS = [
    {
      label: "Maxillary Deciduous",
      list: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
      isBaby: true,
    },
    {
      label: "Maxillary Permanent",
      list: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
      isBaby: false,
    },
    {
      label: "Mandibular Permanent",
      list: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
      isBaby: false,
    },
    {
      label: "Mandibular Deciduous",
      list: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
      isBaby: true,
    },
  ];

  const [isSaving, setIsSaving] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [selection, setSelection] = useState(null); // { tooth: 18, surface: 'top' }
  const [surfaceNote, setSurfaceNote] = useState("");

  // Transform flat Appwrite items into a searchable map with parsed JSON
  const toothMap = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const toothKey = Number(item.toothNumber);
      let parsedSurfaces = {};
      try {
        // Appwrite stores 'surfaces' as a string
        parsedSurfaces =
          typeof item.surfaces === "string"
            ? JSON.parse(item.surfaces)
            : item.surfaces || {};
      } catch (e) {
        parsedSurfaces = {};
      }
      map[toothKey] = { ...item, surfaces: parsedSurfaces };
    });
    return map;
  }, [items]);

  const handleApplyCondition = async (condition) => {
    if (!selection) {
      notify.error("Please select a tooth surface first");
      return;
    }

    const actionId = condition ? condition.id : "clear";

    const { tooth, surface } = selection;
    const existingRecord = toothMap[tooth];
    const currentSurfaces = existingRecord?.surfaces || {};

    // 👉 New Structure: surface: { id, abbr, note }
    const updatedSurfaces = {
      ...currentSurfaces,
      [surface]: condition
        ? {
            id: condition.id,
            abbr: condition.abbr,
            note: surfaceNote.trim(), // Attaches the note specifically to this surface
          }
        : null,
    };

    const payload = {
      ...existingRecord,
      toothNumber: String(tooth),
      surfaces: updatedSurfaces, // Will be stringified by your store/modal logic
      patientId: String(patientId),
    };

    try {
      setIsSaving(true);
      setActiveAction(actionId); // Start Loading

      await onUpdateTooth(payload);
      setSurfaceNote("");
      // Optional: notify.success("Saved successfully");
    } catch (error) {
      console.error(error);
      notify.error(`Failed to save. Error: ${error}`);
    } finally {
      setIsSaving(false); // Stop Loading
      setActiveAction(null); // I-reset pagkatapos
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure? This will delete all findings for this patient.",
      )
    ) {
      await clearChart(patientId);
    }
  };

  // Grouped for better UI organization
  const CONDITION_GROUPS = [
    {
      name: "Clinical Status (Red = Caries/Defect)",
      items: [
        { id: "caries", label: "Caries", abbr: "C", color: "bg-red-500" },
        {
          id: "recurrent_caries",
          label: "Recurrent Caries",
          abbr: "RC",
          color: "bg-red-600",
        },
        { id: "fractured", label: "Fractured", abbr: "F", color: "bg-red-700" },
        {
          id: "impacted",
          label: "Impacted",
          abbr: "Imp",
          color: "bg-orange-500",
        },
        {
          id: "unerupted",
          label: "Unerupted",
          abbr: "Un",
          color: "bg-orange-400",
        },
        {
          id: "extraction",
          label: "Indicated for Extraction",
          abbr: "X",
          color: "bg-zinc-900",
        },
        { id: "missing", label: "Missing", abbr: "M", color: "bg-zinc-400" },
      ],
    },
    {
      name: "Restorations (Blue = Restorations)",
      items: [
        { id: "amalgam", label: "Amalgam", abbr: "Am", color: "bg-blue-600" },
        {
          id: "composite",
          label: "Composite",
          abbr: "Co",
          color: "bg-blue-500",
        },
        {
          id: "glassionomer",
          label: "Glassionomer",
          abbr: "GI",
          color: "bg-cyan-500",
        },
        {
          id: "sealant",
          label: "Pit and Fissure Sealant",
          abbr: "PFS",
          color: "bg-sky-400",
        },
        { id: "inlay", label: "Inlay", abbr: "In", color: "bg-indigo-500" },
      ],
    },
    {
      name: "Prosthodontics & Others",
      items: [
        {
          id: "abutment",
          label: "Abutment",
          abbr: "Ab",
          color: "bg-purple-600",
        },
        {
          id: "apc",
          label: "All Porcelain Crown",
          abbr: "APC",
          color: "bg-purple-500",
        },
        {
          id: "pfc",
          label: "Porcelain Fused to Metal",
          abbr: "PFM",
          color: "bg-fuchsia-600",
        },
        {
          id: "pfg",
          label: "Porcelain Fused to Gold",
          abbr: "PFG",
          color: "bg-amber-600",
        },
        {
          id: "gold_crown",
          label: "Gold Crown",
          abbr: "GC",
          color: "bg-yellow-600",
        },
        {
          id: "metal_crown",
          label: "Metal Crown",
          abbr: "MC",
          color: "bg-slate-500",
        },
        {
          id: "ss_crown",
          label: "Stainless Steel Crown",
          abbr: "SS",
          color: "bg-slate-400",
        },
        { id: "pontic", label: "Pontic", abbr: "P", color: "bg-emerald-700" },
        {
          id: "rpd",
          label: "Removable Partial Denture",
          abbr: "RPD",
          color: "bg-pink-500",
        },
        {
          id: "cd",
          label: "Complete Denture",
          abbr: "CD",
          color: "bg-pink-600",
        },
        {
          id: "caries_free",
          label: "Caries Free",
          abbr: "✓",
          color: "bg-emerald-500",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col xl:grid xl:grid-cols-12 gap-4 p-2 sm:p-4 lg:p-6 max-w-full mx-auto">
      {/* LEFT: THE CHART */}
      <div className="xl:col-span-9 bg-white dark:bg-zinc-900 border border-[#DCD1B4] rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-10 shadow-sm">
        <div className="flex justify-end">
          <button
            onClick={handlePrint}
            className="btn btn-primary rounded-2xl flex items-center gap-2"
          >
            Print Dental Chart
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 text-[10px] font-black uppercase bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all border border-red-100"
          >
            {loading ? "Clearing..." : "Reset Chart"}
          </button>
        </div>

        <div
          ref={chartRef}
          className="space-y-8 overflow-x-auto pb-4 custom-scrollbar flex flex-col"
        >
          {ARCH_GROUPS.map((arch) => (
            // To this (Remove the ml- classes):
            <div
              key={arch.label}
              className="flex flex-col items-center w-full min-w-max"
            >
              {/* Siguraduhin na hindi liliit sa 600px sa mobile */}
              <div className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center mb-4">
                {arch.label}
              </div>

              {/* <div className="flex justify-center items-center gap-1 sm:gap-4 lg:gap-8 w-max mx-auto flex-shrink-0"> */}
              <div className="flex justify-center items-center w-full max-w-5xl mx-auto px-2">
                {/* We split the list in half to create the Left/Right visual gap */}
                <div className="flex flex-1 justify-end gap-1 sm:gap-2 min-w-max">
                  {arch.list.slice(0, arch.list.length / 2).map((num) => (
                    <div
                      key={num}
                      className="scale-75 sm:scale-90 lg:scale-100 flex-shrink-0"
                    >
                      <Tooth
                        key={num}
                        toothNumber={num}
                        surfaces={toothMap[num]?.surfaces ?? {}}
                        selectedSurface={selection}
                        onSurfaceClick={(tooth, surface) => {
                          // We calculate the clinical label on the fly
                          const clinicalLabel = getSurfaceLabel(tooth, surface);

                          setSelection({
                            tooth,
                            surface,
                            displayLabel: clinicalLabel, // Store this for the UI
                          });

                          setSurfaceNote(
                            toothMap[tooth]?.surfaces?.[surface]?.note || "",
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* CENTER MIDLINE DIVIDER */}
                <div className="flex flex-col items-center justify-center mx-1 sm:mx-4 flex-shrink-0">
                  <div className="h-18 w-[1.5px] bg-zinc-300 dark:bg-zinc-700" />
                </div>

                <div className="flex flex-1 justify-start gap-1 sm:gap-2 min-w-max">
                  {arch.list.slice(arch.list.length / 2).map((num) => (
                    <div
                      key={num}
                      className="scale-75 sm:scale-90 lg:scale-100 flex-shrink-0"
                    >
                      <Tooth
                        key={num}
                        toothNumber={num}
                        surfaces={toothMap[num]?.surfaces ?? {}}
                        selectedSurface={selection}
                        onSurfaceClick={(tooth, surface) => {
                          // We calculate the clinical label on the fly
                          const clinicalLabel = getSurfaceLabel(tooth, surface);

                          setSelection({
                            tooth,
                            surface,
                            displayLabel: clinicalLabel, // Store this for the UI
                          });

                          setSurfaceNote(
                            toothMap[tooth]?.surfaces?.[surface]?.note || "",
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM SECTION: CONDITION SUMMARY */}
        <div className="mt-8 sm:mt-12 bg-white dark:bg-zinc-900 rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-zinc-50/50 border-b border-zinc-50">
            <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
              Recorded Findings
            </h3>
          </div>

          <div className="overflow-x-auto shadow-inner">
            {" "}
            {/* Responsive wrapper for table */}
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-[10px] font-black uppercase text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-8 py-3">Tooth</th>
                  <th className="px-8 py-3">Surfaces / Conditions</th>
                  <th className="px-8 py-3">Surface Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-8 py-10 text-center text-zinc-400 text-xs italic"
                    >
                      No findings recorded yet.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const surfaces =
                      typeof item.surfaces === "string"
                        ? JSON.parse(item.surfaces)
                        : item.surfaces;
                    return (
                      <tr
                        key={item.$id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-8 py-4">
                          <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-xs font-black">
                            {item.toothNumber}
                          </span>
                        </td>

                        <td className="px-8 py-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(surfaces || {}).map(
                              ([key, val]) =>
                                val && (
                                  <span
                                    key={key}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 ..."
                                  >
                                    <span className="text-[10px] font-black uppercase text-zinc-400">
                                      {getSurfaceLabel(item.toothNumber, key)}:
                                    </span>
                                    <span className="text-[10px] font-bold text-zinc-700">
                                      {val.abbr}
                                    </span>
                                  </span>
                                ),
                            )}
                          </div>
                        </td>

                        <td className="px-8 py-4">
                          <div className="space-y-1">
                            {Object.entries(surfaces || {}).map(
                              ([key, val]) =>
                                val?.note && (
                                  <div
                                    key={key}
                                    className="text-[11px] text-zinc-500"
                                  >
                                    <strong className="uppercase text-zinc-400 mr-1">
                                      {key}:
                                    </strong>{" "}
                                    {val.note}
                                  </div>
                                ),
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT: THE CONTROLS & STATUS BUTTONS */}
      <div className="xl:col-span-3 space-y-6">
        <div className="sticky top-6 space-y-4">
          {/* Naka-float ito sa desktop habang nag-scro-scroll */}
          {/* Note Area */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-3xl border border-zinc-200 shadow-inner">
            <h3 className="text-xs font-black uppercase text-zinc-400 mb-2">
              {selection
                ? `Tooth ${selection.tooth} - ${selection.displayLabel}`
                : "Select a surface part"}
            </h3>
            <textarea
              value={surfaceNote}
              readOnly={isSaving} // Prevent typing while saving
              onChange={(e) => setSurfaceNote(e.target.value)}
              placeholder={isSaving ? "Saving note..." : "Add specific note..."}
              className={`w-full p-3 ... ${isSaving ? "bg-zinc-100 opacity-70" : "bg-white"}`}
              rows={2}
            />
          </div>
          {/* Rendering All Status Buttons */}
          {/* Buttons Section - Gawing 2 columns sa tablet, 1 column sa desktop sidebar */}
          <div className="space-y-6 max-h-[50vh] xl:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {CONDITION_GROUPS.map((group) => (
              <div key={group.name} className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 px-2 tracking-widest">
                  {group.name}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-1 gap-2">
                  {group.items.map((item) => {
                    const isLoadingThis = activeAction === item.id;

                    return (
                      <button
                        key={item.id}
                        disabled={!selection || isSaving} // Disable lahat kapag may sinesave
                        onClick={() => handleApplyCondition(item)}
                        className={`flex items-center gap-3 p-2 border rounded-xl transition-all
        ${!selection || isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-50"}
        ${isLoadingThis ? "border-blue-500 bg-blue-50" : "border-zinc-100"}
      `}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${item.color}`}
                        >
                          {isLoadingThis ? "..." : item.abbr}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600">
                          {isLoadingThis ? "Saving..." : item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Clear Button */}
          <button
            onClick={() => handleApplyCondition(null)}
            disabled={!selection || isSaving}
            className="w-full p-4 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex justify-center items-center gap-2 shadow-lg active:scale-95"
          >
            {activeAction === "clear" ? "Clearing..." : "Clear Surface"}
          </button>
        </div>
      </div>
    </div>
  );
}
