"use client";

import React, { useState, useEffect, useRef } from "react";
import { databases, storage } from "@/app/lib/appwrite";
import { Query, ID } from "appwrite";
import { notify } from "@/app/lib/notify"; // ✅ Use your custom notify
import {
  FiEdit3,
  FiX,
  FiCheck,
  FiFileText,
  FiCalendar,
  FiPhone,
  FiUser,
  FiBriefcase,
  FiMapPin,
  FiShield, // Added for Insurance
  FiCamera, // Added for Image fallback
} from "react-icons/fi";

import SubSectionModal from "./SubSectionModal";
import { useNotesStore } from "../../stores/useNotesStore";
import { useMedicalHistoryStore } from "../../stores/useMedicalHistoryStore";
import { useTreatmentPlanStore } from "../../stores/useTreatmentPlanStore";
import { useDentalChartStore } from "../../stores/useDentalChartStore";

import PaymentSectionCard from "./PaymentSectionCard";
import ConsentFormModal from "./ConsentFormModal";
import ProtectedPaymentSection from "./ProtectedPaymentSection";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const PATIENTS_COLLECTION_ID = "patients";
const COLLECTION_TRANSACTIONS = "transactions";

export default function ViewPatientDetailsModal({ patient, isOpen, onClose }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [activeSection, setActiveSection] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedPatient, setUpdatedPatient] = useState({ ...patient });
  const [saving, setSaving] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const notes = useNotesStore();
  const medHistory = useMedicalHistoryStore();
  const treatment = useTreatmentPlanStore();
  const dentalChart = useDentalChartStore();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalPaid: 0, totalRemaining: 0 });

  useEffect(() => {
    if (patient?.$id) {
      notes.fetchItems(patient.$id);
      medHistory.fetchItems(patient.$id);
      treatment.fetchItems(patient.$id);
      dentalChart.fetchItems(patient.$id);
      setUpdatedPatient({ ...patient });
      fetchTransactions();

      console.log(patient);
    }
  }, [patient?.$id]);

  if (!patient || !isOpen) return null;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      // 1. Upload file to Appwrite Storage
      const uploadedFile = await storage.createFile(
        process.env.NEXT_PUBLIC_STORAGE_BUCKET_ID,
        ID.unique(),
        file,
      );

      // 2. Update local state with the new photoFileId
      // This will update the preview immediately
      setUpdatedPatient((prev) => ({
        ...prev,
        photoFileId: uploadedFile.$id,
      }));

      notify.success("Photo uploaded! Remember to save changes.");
    } catch (err) {
      console.error("Upload error:", err);
      notify.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  // Appwrite Image URL Construction
  const patientImageUrl = updatedPatient.photoFileId
    ? `https://appwrite.arctech.fun/v1/storage/buckets/${process.env.NEXT_PUBLIC_STORAGE_BUCKET_ID}/files/${updatedPatient.photoFileId}/view?project=${process.env.NEXT_PUBLIC_CLINIC_NAME}`
    : null;

  const sectionsLoading =
    notes.loading || medHistory.loading || treatment.loading;

  const fetchTransactions = async () => {
    if (!patient?.$id) return;
    try {
      setLoading(true);
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        [Query.equal("patientId", patient.$id), Query.orderDesc("$createdAt")],
      );
      const docs = res.documents;
      const totalRemaining = docs.reduce(
        (sum, t) => sum + Number(t.remaining || 0),
        0,
      );
      setTransactions(docs);
      setSummary({ totalRemaining });
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePatient = async () => {
    try {
      setSaving(true);

      const {
        $id,
        $collectionId,
        $databaseId,
        $createdAt,
        $updatedAt,
        $permissions,
        ...cleanData
      } = updatedPatient;

      // --- NEW LOGIC HERE ---
      // Convert medicalHistory string to array ONLY before saving
      if (typeof cleanData.medicalHistory === "string") {
        cleanData.medicalHistory = cleanData.medicalHistory
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "");
      }
      // -----------------------

      await databases.updateDocument(
        DATABASE_ID,
        PATIENTS_COLLECTION_ID,
        patient.$id,
        cleanData,
      );

      // Refresh the local state with the newly cleaned array
      setUpdatedPatient((prev) => ({
        ...prev,
        medicalHistory: cleanData.medicalHistory,
      }));

      notify.success("Record updated successfully.");
      setEditMode(false);
    } catch (err) {
      console.log("Error updating patient:", err);
      notify.error("Update failed.");
    } finally {
      setSaving(false);
    }
  };

  function calculateAge(birthdate) {
    if (!birthdate || birthdate === "") return null; // Added check for empty string
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return null; // Added check for invalid dates

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  // This converts "1" to "00001"
  const formattedPatientNo = String(updatedPatient.patientNo || 0).padStart(
    5,
    "0",
  );
  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white dark:bg-zinc-950 w-full h-[95vh] sm:h-[95vh] sm:max-w-9xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-white/20 dark:border-zinc-800">
          {/* Header Area */}
          <div className="p-6 sm:p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Profile Image Area */}
              <div className="relative group">
                <div
                  onClick={() => editMode && fileInputRef.current.click()}
                  className={`w-20 h-20 sm:w-24 sm:h-24 bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] overflow-hidden border-2 border-white dark:border-zinc-700 shadow-xl flex-shrink-0 flex items-center justify-center relative ${
                    editMode
                      ? "cursor-pointer ring-4 ring-primary/30 transition-all"
                      : ""
                  }`}
                >
                  {/* Loading Overlay */}
                  {uploading && (
                    <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                      <span className="loading loading-spinner loading-sm text-white"></span>
                    </div>
                  )}

                  {/* Change Photo Overlay (Edit Mode Only) */}
                  {editMode && !uploading && (
                    <div className="absolute inset-0 z-10 bg-black/40 flex flex-col items-center justify-center transition-opacity text-white">
                      <FiCamera size={20} />
                      <span className="text-[8px] font-black uppercase mt-1">
                        Change
                      </span>
                    </div>
                  )}

                  {patientImageUrl ? (
                    <img
                      src={patientImageUrl}
                      alt={updatedPatient.patientName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser size={40} className="text-zinc-300" />
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                {/* Visual indicator for ID */}
                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-zinc-900">
                  <FiCheck size={12} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  {/* <span className="px-2 py-0.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-black rounded-md tracking-widest uppercase">
                    Patient #{formattedPatientNo}
                  </span> */}
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-none">
                  {/* {updatedPatient.patientName} */}
                  {`${updatedPatient.firstName} ${updatedPatient.middleName}. ${updatedPatient.lastName}`}
                  {console.log(updatedPatient)}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Balance:
                  </span>
                  <span className="text-sm font-black text-red-500">
                    ₱{summary.totalRemaining.toLocaleString()}
                  </span>
                </div>

                {/* Add a separator dot */}
                <span className="text-zinc-300 dark:text-zinc-800">•</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Age:
                  </span>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                    {calculateAge(updatedPatient.birthdate)
                      ? `${calculateAge(updatedPatient.birthdate)} yrs`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsConsentModalOpen(true)}
                className="flex-1 sm:flex-none p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
              >
                <FiFileText /> <span className="hidden lg:inline">Consent</span>
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex-1 sm:flex-none p-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest ${editMode ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-emerald-500/10 text-primary border-primary border-1"}`}
              >
                {editMode ? (
                  <>
                    <FiX /> Cancel
                  </>
                ) : (
                  <>
                    <FiEdit3 /> Edit Info
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl active:scale-95 transition-all lg:hidden"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar space-y-8">
            {/* Demographic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* <EditableField
                label="Full Name"
                name="patientName"
                value={updatedPatient.patientName}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiUser />}
              /> */}
              <EditableField
                label="Last Name"
                name="lastName"
                value={updatedPatient.lastName}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiUser />}
              />
              <EditableField
                label="First Name"
                name="firstName"
                value={updatedPatient.firstName}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiUser />}
              />

              <EditableField
                label="Middle Initial"
                name="middleName"
                value={updatedPatient.middleName}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiUser />}
              />
              <EditableField
                label="Gender"
                name="gender"
                value={updatedPatient.gender}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiUser />}
              />
              <EditableField
                label="Contact"
                name="contact"
                value={updatedPatient.contact}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiPhone />}
              />
              <EditableField
                label="Birthdate"
                name="birthdate"
                type="date"
                value={updatedPatient.birthdate}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiCalendar />}
              />
              {/* Display Age badge overlay when not in edit mode */}
              {!editMode && updatedPatient.birthdate && (
                <span className="absolute top-0 right-0 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                  {calculateAge(updatedPatient.birthdate)} Years Old
                </span>
              )}
              <EditableField
                label="Occupation"
                name="occupation"
                value={updatedPatient.occupation}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiBriefcase />}
              />
              <EditableField
                label="Civil Status"
                name="civilStatus"
                value={updatedPatient.civilStatus}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiBriefcase />}
              />
              <EditableField
                label="Emergency Contact"
                name="emergencyToContact"
                value={updatedPatient.emergencyToContact}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiBriefcase />}
              />
              <EditableField
                label="Emergency Contact Number"
                name="emergencyToContactNumber"
                value={updatedPatient.emergencyToContactNumber}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiBriefcase />}
              />

              <EditableField
                label="Address"
                name="address"
                value={updatedPatient.address}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiMapPin />}
              />
              <EditableField
                label="Referral"
                name="referralSource"
                value={updatedPatient.referralSource}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiUser />}
              />

              <EditableField
                label="Email"
                name="email"
                value={updatedPatient.email}
                editMode={editMode}
                onChange={setUpdatedPatient}
                icon={<FiUser />}
              />

              <div className="md:col-span-2 lg:col-span-3">
                <EditableField
                  label="Clinical Notes"
                  name="note"
                  type="textarea"
                  value={updatedPatient.note}
                  editMode={editMode}
                  onChange={setUpdatedPatient}
                />
              </div>
            </div>

            <EditableField
              label="Medical History"
              name="medicalHistory"
              type="textarea"
              // Keep it as the current value (which could be array or string)
              value={updatedPatient.medicalHistory}
              editMode={editMode}
              icon={<FiShield />}
              onChange={(val) => {
                // Just save the raw string value while typing
                setUpdatedPatient((prev) => ({
                  ...prev,
                  medicalHistory: val,
                }));
              }}
            />

            {/* Subsection Cards (Modern Glass Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sectionsLoading ? (
                <div className="col-span-full h-40 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-[2.5rem]" />
              ) : (
                <>
                  <SectionCard
                    title="Dental Chart"
                    description="Visual tooth-by-tooth mapping of conditions and treatments."
                    icon={<FiBriefcase size={20} />}
                    count={dentalChart.items.length}
                    onClick={() =>
                      setActiveSection({
                        title: "Dental Chart",
                        collectionId: "dentalchart",
                      })
                    }
                  />
                  <SectionCard
                    title="Med History"
                    description="Allergies, chronic conditions, and past medical alerts."
                    icon={<FiFileText size={20} />}
                    colorClass="text-blue-500"
                    count={medHistory.items.length}
                    onClick={() =>
                      setActiveSection({
                        title: "Medical History",
                        collectionId: "medicalhistory",
                      })
                    }
                  />
                  <SectionCard
                    title="Clinical Notes"
                    description="Detailed session summaries and observation logs."
                    icon={<FiEdit3 size={20} />}
                    colorClass="text-amber-500"
                    count={notes.items.length}
                    onClick={() =>
                      setActiveSection({
                        title: "Dental Notes",
                        collectionId: "notes",
                      })
                    }
                  />
                  <SectionCard
                    title="Treatment Plan"
                    description="Proposed procedures and future dental goals."
                    icon={<FiCalendar size={20} />}
                    colorClass="text-purple-500"
                    count={treatment.items.length}
                    onClick={() =>
                      setActiveSection({
                        title: "Treatment Plan",
                        collectionId: "treatmentplans",
                      })
                    }
                  />
                  <div className="sm:col-span-2 lg:col-span-4">
                    <ProtectedPaymentSection>
                      <PaymentSectionCard patient={patient} />
                    </ProtectedPaymentSection>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-8 py-3 font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              Close
            </button>
            {editMode && (
              <button
                onClick={handleUpdatePatient}
                disabled={saving}
                className="bg-primary/80 hover:bg-primary hover:cursor-pointer text-white font-black px-8 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                {saving ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>
                    <FiCheck /> Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub Modals */}
      {activeSection && (
        <SubSectionModal
          title={activeSection.title}
          collectionId={activeSection.collectionId}
          patientId={patient.$id}
          onClose={() => setActiveSection(null)}
          patientName={patient?.patientName}
        />
      )}
      {isConsentModalOpen && (
        <ConsentFormModal
          patient={patient}
          calculateAge={calculateAge}
          onClose={() => setIsConsentModalOpen(false)}
        />
      )}
    </>
  );
}

// Sub-components with Modern Styling
function EditableField({ label, name, value, editMode, onChange, type, icon }) {
  // 1. Format the value for the input/textarea
  // If it's an array (medicalHistory), join it with commas for easy editing
  const getFormattedValue = () => {
    if (type === "date" && value) {
      return new Date(value).toISOString().split("T")[0];
    }
    // If it's already a string (because we're currently typing), return it
    if (typeof value === "string") return value;
    // If it's the array from the database, join it
    if (Array.isArray(value)) return value.join(", ");

    return value || "";
  };

  const handleChange = (e) => {
    const newValue = e.target.value;

    // 2. Logic to pass data back to parent
    if (name === "medicalHistory") {
      // Pass the raw string to the parent's custom handler
      // which performs the .split(',') logic
      onChange(newValue);
    } else {
      onChange((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  return (
    <div className="space-y-1.5 relative group">
      {/* Label and Icon */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-emerald-500 transition-colors">
        {icon} <span>{label}</span>
      </div>

      {/* Hint for Medical History */}
      {editMode && name === "medicalHistory" && (
        <span className="text-[9px] font-bold text-emerald-600 animate-pulse">
          Separate with commas (e.g. Asthma, Diabetes)
        </span>
      )}

      {editMode ? (
        /* EDIT MODE: Input or Textarea */
        type === "textarea" ? (
          <textarea
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold transition-all min-h-[100px] text-zinc-900 dark:text-zinc-100"
            value={getFormattedValue()}
            onChange={handleChange}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : (
          <input
            type={type || "text"}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold transition-all text-zinc-900 dark:text-zinc-100"
            value={getFormattedValue()}
            onChange={handleChange}
          />
        )
      ) : (
        /* READ-ONLY MODE */
        <div className="min-h-[40px] flex items-center">
          {Array.isArray(value) ? (
            /* Render Medical History Tags */
            <div className="flex flex-wrap gap-2 mt-1">
              {value.length > 0 ? (
                value.map((item, i) => (
                  <span
                    key={i}
                    className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-rose-100 dark:border-rose-900/30 shadow-sm"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm font-bold text-zinc-400 italic">
                  No history recorded
                </span>
              )}
            </div>
          ) : (
            /* Render Regular Text */
            <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              {value || (
                <span className="text-zinc-400 italic font-normal">
                  Not provided
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title,
  count,
  onClick,
  icon,
  description,
  colorClass = "text-emerald-500",
}) {
  return (
    <div
      onClick={onClick}
      className="relative p-6 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-3xl active:scale-95 transition-all cursor-pointer hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 group overflow-hidden"
    >
      {/* Decorative Background Icon */}
      <div
        className={`absolute -right-2 -bottom-2 opacity-5 dark:opacity-[0.03] group-hover:scale-110 transition-transform duration-500 ${colorClass}`}
      >
        {icon &&
          React.isValidElement(icon) &&
          React.cloneElement(icon, { size: 80 })}
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div
            className={`p-3 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 ${colorClass}`}
          >
            {icon}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
              {count.toString().padStart(2, "0")}
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Entries
            </span>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors">
            {title}
          </h4>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
            Open Section →
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
