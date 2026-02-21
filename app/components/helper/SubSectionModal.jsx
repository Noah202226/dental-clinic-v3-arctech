"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotesStore } from "../../stores/useNotesStore";
import { useMedicalHistoryStore } from "../../stores/useMedicalHistoryStore";
import { useTreatmentPlanStore } from "../../stores/useTreatmentPlanStore";
import { useDentalChartStore } from "@/app/stores/useDentalChartStore";
import { notify } from "@/app/lib/notify";
import ToothIcon from "./ToothIcon";

const sectionMap = {
  notes: useNotesStore,
  medicalhistory: useMedicalHistoryStore,
  treatmentplans: useTreatmentPlanStore,
  dentalchart: useDentalChartStore,
};

// --- MODERN DENTAL CHART SUB-COMPONENTS ---

function LegendItem({ color, label, abbr, count }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 leading-none">
            {label}
          </span>
          {abbr && (
            <span className="text-[8px] text-zinc-400 font-black">{abbr}</span>
          )}
        </div>
      </div>
      <span className="text-[10px] font-black text-zinc-400 group-hover:text-zinc-800 transition-colors">
        {count}
      </span>
    </div>
  );
}

const ActionButton = ({ color, label, onClick }) => (
  <button
    onClick={onClick}
    className={`${color} text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex-1`}
  >
    {label}
  </button>
);

export default function SubSectionModal({
  title,
  collectionId,
  patientId,
  onClose,
}) {
  const useStore = sectionMap[collectionId];
  const { items, fetchItems, addItem, deleteItem, updateItem, loading } =
    useStore();

  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  // Dental Specific States
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [toothDetails, setToothDetails] = useState({ note: "" });

  useEffect(() => {
    fetchItems(patientId);
  }, [patientId, fetchItems]);

  useEffect(() => {
    resetForm();
  }, [collectionId]);

  const resetForm = () => {
    setEditingId(null);
    const defaults = {
      medicalhistory: {
        medicalName: "",
        description: "",
        diagnosisDate: "",
        severity: "Low",
        status: "Active",
      },
      treatmentplans: {
        treatmentDate: "", // Ito ang Date Transaction
        toothNumber: "",
        treatmentNote: "", // Ito ang Recommended Procedure
        estimatedFees: "", // Estimated Price
        description: "", // Comments / Notes
        name: "", // Attending Dentist
      },
      // Updated defaults for notes
      notes: {
        name: "", // Attending Dentist
        description: "", // General Notes
        toothNumber: "", // Added
        procedure: "", // Added
        dateTransact: "", // Added
      },
    };
    setForm(
      defaults[collectionId] || {
        toothNumber: "",
        name: "",
        description: "",
        procedure: "",
        dateTransact: "",
      },
    );
  };

  const handleSave = async () => {
    setAdding(true);
    try {
      if (editingId) {
        const {
          $id,
          $collectionId,
          $databaseId,
          $createdAt,
          $updatedAt,
          $permissions,
          ...cleanData
        } = form;

        await updateItem(editingId, cleanData);
        notify.success("Record updated successfully");
      } else {
        await addItem(patientId, form);
        notify.success("New record added");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      notify.error("Failed to save clinical record");
    } finally {
      setAdding(false);
    }
  };

  // --- RENDERING HELPERS ---
  const renderListItems = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 border border-[#DCD1B4] dark:border-zinc-800 p-5 rounded-2xl animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                    <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                  </div>
                  <div className="h-5 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded-md" />
                  <div className="h-12 w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-100 dark:border-zinc-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // --- SORTING LOGIC START ---
    // Create a copy and sort by the most relevant date field descending
    const sortedItems = [...items].sort((a, b) => {
      const dateA = new Date(
        a.dateTransact ||
          a.treatmentDate ||
          a.diagnosisDate ||
          a.date ||
          a.$createdAt,
      );
      const dateB = new Date(
        b.dateTransact ||
          b.treatmentDate ||
          b.diagnosisDate ||
          b.date ||
          b.$createdAt,
      );
      return dateB - dateA; // Newest first
    });
    // --- SORTING LOGIC END ---

    return (
      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => (
            <div
              key={item.$id}
              className="bg-white dark:bg-zinc-900 border border-[#DCD1B4] dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:border-emerald-200 dark:hover:border-emerald-500 transition-colors group"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {/* DYNAMIC DATE BADGE - Hidden for Treatment Plans */}
                    {collectionId !== "treatmentplans" && (
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {(() => {
                          const dateValue =
                            item.dateTransact ||
                            item.diagnosisDate ||
                            item.treatmentDate ||
                            item.date ||
                            item.$createdAt;
                          if (!dateValue) return "No Date";
                          return new Date(dateValue).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          );
                        })()}
                      </span>
                    )}

                    {/* TOOTH NUMBER BADGE (Notes) */}
                    {collectionId === "notes" && item.toothNumber && (
                      <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Tooth {item.toothNumber}
                      </span>
                    )}

                    {/* SEVERITY BADGE (Medical History) */}
                    {collectionId === "medicalhistory" && (
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          item.severity === "High"
                            ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                            : item.severity === "Moderate"
                              ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
                              : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        }`}
                      >
                        {item.severity || "Low"} Severity
                      </span>
                    )}
                  </div>

                  {/* MAIN HEADING */}
                  <h4 className="font-black text-zinc-800 dark:text-zinc-100 uppercase text-sm mb-1">
                    {item.treatmentNote ||
                      item.procedure ||
                      item.medicalName ||
                      item.name ||
                      "Untitled Record"}
                  </h4>

                  {/* TREATMENT PLAN SPECIFIC FIELDS */}
                  {collectionId === "treatmentplans" && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {item.estimatedFees && (
                        <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-1 rounded-lg">
                          ₱{Number(item.estimatedFees).toLocaleString()}
                        </span>
                      )}
                      {item.toothNumber && (
                        <span className="text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded-full uppercase tracking-widest">
                          Tooth {item.toothNumber}
                        </span>
                      )}
                    </div>
                  )}

                  {/* DENTIST SUB-INFO (Notes & Treatment Plans) */}
                  {(collectionId === "notes" ||
                    collectionId === "treatmentplans") &&
                    item.name && (
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                        Dentist: {item.name}
                      </p>
                    )}

                  {/* CLINICAL OBSERVATIONS / NOTES */}
                  {(item.description || item.note) && (
                    <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                      <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                        "{item.description || item.note}"
                      </p>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-1 ml-4 shrink-0">
                  <button
                    onClick={() => {
                      setEditingId(item.$id);
                      setForm(item);
                    }}
                    className="btn btn-sm btn-circle btn-ghost text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteItem(item.$id)}
                    className="btn btn-sm btn-circle btn-ghost text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem]">
            <p className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-widest italic">
              No clinical records found
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderFormFields = () => {
    const inputClass =
      "input w-full bg-[#FFF8EA] dark:bg-zinc-900 border-[#DCD1B4] dark:border-zinc-700 rounded-xl font-bold text-zinc-800 dark:text-zinc-100";
    const labelClass =
      "text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 mb-1 block";

    switch (collectionId) {
      case "medicalhistory":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Condition Name</label>
              <input
                type="text"
                className={inputClass}
                value={form.medicalName || ""}
                onChange={(e) =>
                  setForm({ ...form, medicalName: e.target.value })
                }
                placeholder="e.g. Hypertension"
              />
            </div>
            <div>
              <label className={labelClass}>Severity</label>
              <select
                className={inputClass + " select text-xs"}
                value={form.severity || "Low"}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Diagnosis Date</label>
              <input
                type="date"
                className={inputClass + " text-xs"}
                value={form.diagnosisDate || ""}
                onChange={(e) =>
                  setForm({ ...form, diagnosisDate: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Clinical Notes</label>
              <textarea
                className={inputClass + " textarea min-h-[100px]"}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Medications, allergies..."
              />
            </div>
          </div>
        );
      case "treatmentplans":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Date Transaction */}
              {/* <div>
                <label className={labelClass}>Date Transaction</label>
                <input
                  type="date"
                  className={inputClass + " text-xs"}
                  value={form.treatmentDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, treatmentDate: e.target.value })
                  }
                />
              </div> */}
              {/* Tooth Number */}
              <div>
                <label className={labelClass}>Tooth Number</label>
                <input
                  type="text"
                  placeholder="e.g. 14, 15"
                  className={inputClass}
                  value={form.toothNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, toothNumber: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Recommended Procedure */}
            <div>
              <label className={labelClass}>Recommended Procedure</label>
              <input
                type="text"
                placeholder="e.g. Fixed Bridge, Extraction"
                className={inputClass}
                value={form.treatmentNote || ""}
                onChange={(e) =>
                  setForm({ ...form, treatmentNote: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Estimated Price / Fees */}
              <div>
                <label className={labelClass}>Estimated Price / Fees</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">
                    ₱
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className={inputClass + " pl-7"}
                    value={form.estimatedFees || ""}
                    onChange={(e) =>
                      setForm({ ...form, estimatedFees: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* Attending Dentist */}
              <div>
                <label className={labelClass}>Attending Dentist</label>
                <input
                  type="text"
                  placeholder="Dr. ..."
                  className={inputClass}
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            {/* Comments / Notes */}
            <div>
              <label className={labelClass}>Comments / Notes</label>
              <textarea
                className={inputClass + " textarea min-h-[100px]"}
                placeholder="Additional details about the plan..."
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Date of Transaction */}
              <div>
                <label className={labelClass}>Date of Transaction</label>
                <input
                  type="date"
                  className={inputClass + " text-xs"}
                  value={form.dateTransact || ""}
                  onChange={(e) =>
                    setForm({ ...form, dateTransact: e.target.value })
                  }
                />
              </div>

              {/* Tooth Number */}
              <div>
                <label className={labelClass}>Tooth Number</label>
                <input
                  type="text"
                  placeholder="e.g. 11, 12, 48"
                  className={inputClass}
                  value={form.toothNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, toothNumber: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Procedure */}
            <div>
              <label className={labelClass}>Procedure</label>
              <input
                type="text"
                placeholder="e.g. Oral Prophylaxis"
                className={inputClass}
                value={form.procedure || ""}
                onChange={(e) =>
                  setForm({ ...form, procedure: e.target.value })
                }
              />
            </div>

            {/* Attending Dentist (mapped to 'name' based on your previous code) */}
            <div>
              <label className={labelClass}>Attending Dentist</label>
              <input
                type="text"
                placeholder="Dr. Name"
                className={inputClass}
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Description/Notes */}
            <div>
              <label className={labelClass}>Clinical Observations</label>
              <textarea
                className={inputClass + " textarea min-h-[120px]"}
                placeholder="Enter detailed findings..."
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <dialog open className="modal modal-open z-[1000]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="modal-box w-full max-w-[95vw] xl:max-w-[95vw] max-h-[95vh] lg:max-h-[95vh] bg-[#FBFBFB] dark:bg-zinc-950 rounded-[2rem] lg:rounded-[2.5rem] p-0 overflow-hidden border border-[#DCD1B4] dark:border-zinc-800 shadow-2xl flex flex-col"
      >
        <div className="p-4 lg:p-8 border-b border-[#E6D8BA] dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 sticky top-0 z-50">
          <div>
            <h3 className="font-black text-lg lg:text-2xl uppercase tracking-tight text-zinc-800 dark:text-zinc-100">
              {title}
            </h3>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
              Clinical Dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost hover:bg-red-50 text-zinc-500"
          >
            ✕
          </button>
        </div>

        <div className="p-4 lg:p-8 overflow-y-auto custom-scrollbar flex-1 pb-32 sm:pb-8 ">
          {collectionId === "dentalchart" ? (
            <DentalChartSection
              items={items}
              patientId={patientId}
              selectedTooth={selectedTooth}
              setSelectedTooth={setSelectedTooth}
              toothDetails={toothDetails}
              setToothDetails={setToothDetails}
              loading={loading}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-3">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-600 mb-4 tracking-widest">
                  Historical Records
                </h4>
                {renderListItems()}
              </div>
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-[#DCD1B4] dark:border-zinc-800 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 mb-6 tracking-widest">
                  {editingId ? "Update Existing" : "Create New Entry"}
                </h4>
                {renderFormFields()}
                <button
                  onClick={handleSave}
                  disabled={adding}
                  className="btn w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all"
                >
                  {adding
                    ? "Syncing..."
                    : editingId
                      ? "Save Changes"
                      : "Commit to Record"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="btn btn-ghost w-full mt-2 text-[10px] font-black uppercase text-zinc-400"
                  >
                    Discard Edits
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </dialog>
  );
}

// --- DENTAL CHART SECTION ---
function DentalChartSection({
  items,
  patientId,
  selectedTooth,
  setSelectedTooth,
  toothDetails,
  setToothDetails,
  loading,
}) {
  const UPPER = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  ];
  const LOWER = [
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
  ];

  const [isSaving, setIsSaving] = useState(false);

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

  // Flattened for logic checks
  const ALL_CONDITIONS = CONDITION_GROUPS.flatMap((g) => g.items);

  const stats = useMemo(() => {
    const counts = {};
    ALL_CONDITIONS.forEach((c) => (counts[c.id] = 0));
    counts.notes = 0;
    if (loading) return counts;

    items?.forEach((i) => {
      if (i.status && counts[i.status] !== undefined) {
        counts[i.status]++;
      }
      if (i.note) counts.notes++;
    });
    return counts;
  }, [items, loading]);

  const updateStatus = async (status) => {
    if (!selectedTooth) return;
    setIsSaving(true);
    try {
      await useDentalChartStore
        .getState()
        .updateTooth(patientId, selectedTooth, status, toothDetails.note);
      notify.success(`Tooth ${selectedTooth} updated`);
      setIsSaving(false);
      setSelectedTooth(null);
      setToothDetails({ note: "" });
    } catch (e) {
      notify.error("Update failed");
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 ">
      {/* LEFT: MAIN CHART (Wider) */}
      <div className="w-full lg:col-span-8 bg-white dark:bg-zinc-900 border border-[#DCD1B4] dark:border-zinc-800 rounded-[1.5rem] lg:rounded-[2.5rem] p-4 lg:p-10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="w-max-full">
            <div className="text-[10px] font-black uppercase text-zinc-300 dark:text-zinc-600 tracking-widest text-center mb-8 italic">
              Maxillary (Upper)
            </div>
            <div className="grid grid-cols-16 gap-3">
              {UPPER.map((num) => (
                <ToothButton
                  key={num}
                  num={num}
                  items={items}
                  selected={selectedTooth === num}
                  onClick={() => {
                    // 1. Find the existing data for this tooth
                    const existingRecord = items?.find(
                      (item) => String(item.toothNumber) === String(num),
                    );

                    // 2. Set the selected tooth ID
                    setSelectedTooth(num);

                    // 3. Populate the form with the existing note (or empty string if none)
                    setToothDetails({
                      note: existingRecord?.note || "",
                    });
                  }}
                />
              ))}
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-[#E6D8BA] dark:via-zinc-800 to-transparent w-full my-8" />
            <div className="grid grid-cols-16 gap-3">
              {LOWER.map((num) => (
                <ToothButton
                  key={num}
                  num={num}
                  items={items}
                  selected={selectedTooth === num}
                  onClick={() => {
                    // 1. Find the existing data for this tooth
                    const existingRecord = items?.find(
                      (item) => String(item.toothNumber) === String(num),
                    );

                    // 2. Set the selected tooth ID
                    setSelectedTooth(num);

                    // 3. Populate the form with the existing note (or empty string if none)
                    setToothDetails({
                      note: existingRecord?.note || "",
                    });
                  }}
                />
              ))}
            </div>
            <div className="text-[10px] font-black uppercase text-zinc-300 dark:text-zinc-600 tracking-widest text-center mt-8 italic">
              Mandibular (Lower)
            </div>
          </div>

          {/* UPDATE PANEL */}
          <AnimatePresence mode="wait">
            {selectedTooth ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#FFF8EA] dark:bg-zinc-900 p-6 rounded-[2rem] border-2 border-emerald-200 dark:border-emerald-900/30 shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-lg text-zinc-800 dark:text-zinc-100">
                    Tooth {selectedTooth}
                  </h4>
                  <button
                    onClick={() => setSelectedTooth(null)}
                    className="text-[10px] font-black uppercase text-zinc-400 hover:text-red-500"
                  >
                    Cancel
                  </button>
                </div>

                {/* --- NEW: PREVIEW OF EXISTING NOTE --- */}
                {items?.find(
                  (x) => String(x.toothNumber) === String(selectedTooth),
                )?.note && (
                  <div className="mb-4 p-3 bg-white dark:bg-zinc-800 border-l-4 border-emerald-500 rounded-r-xl shadow-sm">
                    <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">
                      Current Saved Note:
                    </p>
                    <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 italic">
                      "
                      {
                        items.find(
                          (x) =>
                            String(x.toothNumber) === String(selectedTooth),
                        ).note
                      }
                      "
                    </p>
                  </div>
                )}

                {/* --- INPUT WITH DEDICATED SAVE BUTTON --- */}
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    className="input flex-1 bg-white dark:bg-zinc-800 border-[#DCD1B4] dark:border-zinc-700 rounded-xl font-bold text-xs"
                    placeholder="Update findings..."
                    value={toothDetails.note}
                    onChange={(e) =>
                      setToothDetails({ ...toothDetails, note: e.target.value })
                    }
                  />
                  <button
                    onClick={() => {
                      const existing = items?.find(
                        (x) => String(x.toothNumber) === String(selectedTooth),
                      );
                      updateStatus(existing?.status || "healthy");
                    }}
                    className="bg-primary/80 hover:bg-primary text-white px-4 rounded-xl text-[10px] font-black uppercase transition-all"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
                {/* ---------------------------------------- */}

                <div className="space-y-4">
                  {CONDITION_GROUPS.map((group) => (
                    <div key={group.name}>
                      <p className="text-[8px] font-black uppercase text-zinc-400 mb-2 ml-1">
                        {group.name}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {group.items.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => updateStatus(c.id)}
                            className={`${c.color} text-white p-2 rounded-xl hover:brightness-90 transition-all flex flex-col items-center justify-center min-h-[45px] shadow-sm`}
                          >
                            <span className="text-[10px] font-black">
                              {c.abbr}
                            </span>
                            <span className="text-[7px] font-bold opacity-80 uppercase truncate w-full text-center">
                              {c.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] text-center bg-zinc-50/50 dark:bg-transparent">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <span className="text-xl">🦷</span>
                </div>
                <p className="text-[10px] font-black uppercase text-zinc-300 dark:text-zinc-700 tracking-[0.2em] leading-relaxed">
                  Select a tooth from <br /> the chart to begin
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: LEGEND & UPDATE PANEL */}
      <div className="lg:col-span-4 space-y-6">
        {/* VIEWABLE LEGEND GRID */}
        <div className="bg-white dark:bg-zinc-900 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-[#DCD1B4] dark:border-zinc-800">
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-4">
              Live Summary
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6 gap-y-4 max-h-[200px] lg:max-h-none overflow-y-auto">
              {CONDITION_GROUPS.map((group) => (
                <div key={group.name} className="space-y-3">
                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                    {group.name}
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {group.items.map((c) => (
                      <LegendItem
                        key={c.id}
                        color={c.color}
                        label={c.label}
                        abbr={c.abbr}
                        count={stats[c.id]}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                <LegendItem
                  color="bg-blue-500"
                  label="With Notes"
                  count={stats.notes}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToothButton({ num, items, selected, onClick }) {
  const data = items?.find((x) => String(x.toothNumber) === String(num));
  return (
    <button
      onClick={onClick}
      className={`transition-all duration-300 ${selected ? "scale-125 z-10" : "hover:scale-110 opacity-90 hover:opacity-100"}`}
    >
      <ToothIcon
        status={data?.status || "healthy"}
        hasNote={!!data?.note}
        toothNumber={num}
        isSelected={selected}
      />
    </button>
  );
}
