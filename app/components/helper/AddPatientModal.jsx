"use client";

import { useEffect, useState } from "react";
import { notify } from "@/app/lib/notify";
import { FiLoader, FiUser } from "react-icons/fi";
import { databases } from "@/app/lib/appwrite";
import { Query } from "appwrite";

export default function AddPatientModal({
  isOpen,
  setIsOpen,
  onSave,
  loading,
}) {
  const [form, setForm] = useState({
    patientName: "",
    firstName: "",
    lastName: "",
    middleName: "",
    address: "",
    birthdate: "",
    gender: "",
    contact: "",
    civilStatus: "",
    occupation: "",
    emergencyToContact: "",
    emergencyToContactNumber: "",
    note: "",
    email: "",
    referralSource: "",
    medicalHistory: [],
  });

  const generateNextPatientNo = async () => {
    try {
      // 1. Fetch the single document with the highest patientNo
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID,
        "patients",
        [Query.orderDesc("patientNo"), Query.limit(1)],
      );

      // 2. If records exist, increment the highest; otherwise, start at 1
      const lastNo =
        response.documents.length > 0 ? response.documents[0].patientNo : 0;

      return lastNo + 1;
    } catch (err) {
      console.error("Error generating patient number:", err);
      return 1; // Fallback
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.firstName && !form.lastName && !form.middleName) {
      return notify.error("Patient identity is required.");
    }
    const nextNo = await generateNextPatientNo();
    const patientData = { ...form, patientNo: nextNo };
    onSave(patientData);
  };

  useEffect(() => {
    if (!isOpen) {
      setForm({
        patientName: "",
        address: "",
        birthdate: "",
        gender: "",
        contact: "",
        civilStatus: "",
        occupation: "",
        emergencyToContact: "",
        emergencyToContactNumber: "",
        note: "",
        email: "",
        referralSource: "",
        medicalHistory: [],
      });
    }
  }, [isOpen]);

  return (
    <dialog
      id="add_patient_modal"
      className={`modal backdrop-blur-md ${isOpen ? "modal-open" : ""}`}
    >
      <div className="modal-box max-w-4xl bg-white dark:bg-zinc-950 p-0 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter flex items-center gap-3">
            <span className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <FiUser />
            </span>
            Register <span className="text-emerald-500">Patient</span>
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 font-bold text-[10px] mt-2 ml-16 uppercase tracking-widest">
            Enter demographic and clinical background info
          </p>
        </div>

        {/* Tab System Content */}
        <div className="p-8">
          <div role="tablist" className="tabs tabs-lifted">
            {/* --- TAB 1: Demographics --- */}
            <input
              type="radio"
              name="patient_tabs"
              role="tab"
              className="tab font-black uppercase text-[10px] tracking-widest [--tab-accent-color:#10b981] !text-zinc-900 dark:!text-zinc-100 border-zinc-200 dark:border-zinc-800"
              aria-label="Demographics"
              defaultChecked
            />
            <div
              role="tabpanel"
              className="tab-content bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    placeholder="e.g., John Doe"
                    value={form.patientName}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div> */}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="e.g., Doe"
                    value={form.lastName || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="e.g., John"
                    value={form.firstName || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    MIddle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    placeholder="e.g., JD"
                    value={form.middleName || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={form.email || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contact"
                    placeholder="0912..."
                    value={form.contact || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    value={form.birthdate || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none text-sm text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    placeholder="e.g. Engineer"
                    value={form.occupation || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={form.gender || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none text-sm text-zinc-900 dark:text-white"
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Civil Status
                  </label>
                  <select
                    name="civilStatus"
                    value={form.civilStatus || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none text-sm text-zinc-900 dark:text-white"
                  >
                    <option value="">Select</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Widowed</option>
                    <option>Divorced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                  Home Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Unit/Street/City"
                  value={form.address || ""}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none text-sm text-zinc-900 dark:text-white"
                />
              </div>

              {/* Referral Source Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                  Referral Source
                </label>
                <select
                  name="referralSource"
                  value={form.referralSource || ""}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none text-sm text-zinc-900 dark:text-white"
                >
                  <option value="">Select Source</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Recommendation">
                    Friend/Family Recommendation
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* --- TAB 2: Safety --- */}
            <input
              type="radio"
              name="patient_tabs"
              role="tab"
              className="tab font-black uppercase text-[10px] tracking-widest [--tab-accent-color:#10b981] !text-zinc-900 dark:!text-zinc-100 border-zinc-200 dark:border-zinc-800"
              aria-label="Safety"
            />
            <div
              role="tabpanel"
              className="tab-content bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    name="emergencyToContact"
                    placeholder="Full Name"
                    value={form.emergencyToContact || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none text-sm text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    name="emergencyToContactNumber"
                    placeholder="0912..."
                    value={form.emergencyToContactNumber || ""}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none text-sm text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* --- TAB 3: Notes --- */}
            <input
              type="radio"
              name="patient_tabs"
              role="tab"
              className="tab font-black uppercase text-[10px] tracking-widest [--tab-accent-color:#10b981] !text-zinc-900 dark:!text-zinc-100 border-zinc-200 dark:border-zinc-800"
              aria-label="Clinical Notes"
            />
            <div
              role="tabpanel"
              className="tab-content bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mt-4"
            >
              <textarea
                name="note"
                placeholder="Allergies, previous procedures, or medical conditions..."
                value={form.note || ""}
                onChange={handleChange}
                className="w-full h-40 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-4 bg-zinc-50 dark:bg-zinc-900/20">
          <button
            className="px-8 py-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-black text-xs uppercase tracking-widest transition-colors"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <FiLoader className="animate-spin" /> : "Save Record"}
          </button>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setIsOpen(false)}>close</button>
      </form>
    </dialog>
  );
}
