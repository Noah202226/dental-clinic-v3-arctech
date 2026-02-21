"use client";

import { useEffect, useState } from "react";
import {
  FiUserPlus,
  FiSearch,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiLock,
} from "react-icons/fi";
import { notify } from "@/app/lib/notify";
import AddPatientModal from "../helper/AddPatientModal";
import ViewPatientDetailsModal from "../helper/ViewPatientDetailsModal";
import { usePatientStore } from "@/app/stores/usePatientStore";
import { useTransactionsStore } from "@/app/stores/useTransactionsStore";
import { useBranding } from "../context/BrandingProvider"; // Added Branding Context

export default function PatientsSection() {
  const [isInitialFetching, setIsInitialFetching] = useState(true);

  const { config } = useBranding(); // Access brand config
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    patient: null,
  });

  const [deletePassword, setDeletePassword] = useState(null || "");
  const [showPassword, setShowPassword] = useState(false);
  const REQUIRED_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  const { patients, fetchPatients, addPatient, deletePatient } =
    usePatientStore();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(null || "");

  const { fetchAllPayments, getWithBalancePatients } = useTransactionsStore();

  useEffect(() => {
    fetchAllPayments();
    fetchPatients();
    getWithBalancePatients();
  }, [fetchPatients, fetchAllPayments, getWithBalancePatients]);

  useEffect(() => {
    const loadData = async () => {
      setIsInitialFetching(true);
      await Promise.all([
        fetchAllPayments(),
        fetchPatients(),
        getWithBalancePatients(),
      ]);
      setIsInitialFetching(false);
    };

    loadData();
  }, [fetchPatients]); // Note: Ensure fetchPatients is stable or remove from deps if it causes loops

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = (patient) => {
    setConfirmModal({ isOpen: true, patient });
    setDeletePassword("");
    setShowPassword(false);
  };

  const handleDelete = async () => {
    if (deletePassword !== REQUIRED_PASSWORD) {
      return notify.error("Invalid authorization password.");
    }

    try {
      setDeleteLoading(true);
      await deletePatient(confirmModal.patient.$id);
      notify.success("Patient record purged successfully.");
      setConfirmModal({ isOpen: false, patient: null });
      setDeletePassword("");
      setShowPassword(false);
      fetchPatients();
    } catch (error) {
      notify.error("Failed to delete record.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSavePatient = async (newData) => {
    try {
      setLoading(true);
      await addPatient(newData);
      notify.success("New patient registered.");
      setIsOpen(false);
      fetchPatients();
    } catch (err) {
      notify.error("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients
    .filter((p) => {
      const name = p.patientName || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    // Mas ligtas na i-sort dito bago i-render para hindi paulit-ulit sa JSX
    .sort((a, b) => (a.patientName || "").localeCompare(b.patientName || ""));

  // For Desktop: Returns a <tr> to be used inside <tbody>
  const DesktopSkeleton = () => (
    <tr className="animate-pulse border-b border-zinc-100 dark:border-zinc-900">
      <td className="py-6 px-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
          </div>
        </div>
      </td>
      <td>
        <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
      </td>
      <td>
        <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
      </td>
      <td>
        <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
      </td>
      <td className="px-8">
        <div className="flex justify-end gap-2">
          <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
        </div>
      </td>
    </tr>
  );

  // For Mobile: Returns a <div> to be used inside the list container
  const MobileSkeleton = () => (
    <div className="p-5 space-y-4 animate-pulse border-b border-zinc-100 dark:border-zinc-900">
      <div className="flex gap-4">
        <div className="h-16 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-md" />
            <div className="h-5 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase">
            Clinical <span className="text-primary">Records</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1 text-sm lg:text-base">
            Centralized database for patient history and financial balances.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <>
              <FiUserPlus size={18} /> Add New Patient
            </>
          )}
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Total Patients
          </p>
          <div className="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">
            {isInitialFetching ? (
              <div className="h-10 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            ) : (
              patients.length
            )}
          </div>
        </div>

        {/* Placeholder for future growth or specific stats */}
        {/* <div className="hidden sm:block bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem]">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Live Status
          </p>
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Syncing Records
          </div>
        </div> */}
      </div>

      {/* Database View Container */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/[0.02]">
        {/* Search Bar Area */}
        <div className="p-4 lg:p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="relative max-w-md group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-12 pr-6 py-3 lg:py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl lg:rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-zinc-50/30 dark:bg-zinc-900/10">
                <th className="py-6 px-8">Patient Identity</th>
                <th>Address</th>
                <th>Contact Info</th>
                <th>Email</th>
                <th className="text-right px-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
              {isInitialFetching ? (
                // Show 5 skeleton rows while loading
                [...Array(5)].map((_, i) => <DesktopSkeleton key={i} />)
              ) : filteredPatients.length > 0 ? (
                [...filteredPatients]
                  .sort((a, b) => a.patientName?.localeCompare(b.patientName))
                  .map((patient) => (
                    <tr
                      key={patient.$id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-all"
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                            {patient?.photoFileId ? (
                              <img
                                src={`https://appwrite.arctech.fun/v1/storage/buckets/profile-image-bucket/files/${patient.photoFileId}/view?project=manila-dental-arts-v3`}
                                alt={patient?.patientName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-zinc-400 font-bold text-xl uppercase">
                                {patient.firstName?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                              {`${patient.firstName} ${patient.middleName || ""} ${patient.lastName}`}
                            </p>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                              {patient.gender || "N/A"} •{" "}
                              {patient.occupation || "General"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-zinc-500 dark:text-zinc-400 font-medium text-sm italic">
                        <span className="truncate max-w-[200px] block">
                          {patient.address || "No address provided"}
                        </span>
                      </td>
                      <td className="text-zinc-600 dark:text-zinc-300 font-black text-xs tracking-widest">
                        {patient.contact || ""}
                      </td>
                      <td className="text-zinc-600 dark:text-zinc-300 font-black text-xs tracking-widest lowercase">
                        {patient.email || "---"}
                      </td>
                      <td className="px-8">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(patient)}
                            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-primary hover:text-white rounded-xl text-zinc-500 transition-all duration-200 group"
                            title="View Details"
                          >
                            <FiEye
                              size={18}
                              className="group-hover:scale-110 transition-transform"
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(patient)}
                            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-500 rounded-xl text-red-500/70 hover:text-white transition-all duration-200 group"
                            title="Delete Record"
                          >
                            <FiTrash2
                              size={18}
                              className="group-hover:scale-110 transition-transform"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-24 text-zinc-400 font-bold uppercase tracking-widest text-xs opacity-50"
                  >
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: List */}
        <div className="lg:hidden divide-y divide-zinc-100 dark:divide-zinc-900">
          {isInitialFetching ? (
            // Show 5 skeleton rows while loading
            [...Array(5)].map((_, i) => <MobileSkeleton key={i} />)
          ) : filteredPatients.length > 0 ? (
            [...filteredPatients]
              .sort((a, b) => a.firstName?.localeCompare(b.firstName))
              .map((patient) => (
                <div key={patient.$id} className="p-5 space-y-4">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                      {patient?.photoFileId ? (
                        <img
                          src={`https://appwrite.arctech.fun/v1/storage/buckets/profile-image-bucket/files/${patient.photoFileId}/view?project=manila-dental-arts-v3`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-400 font-bold text-2xl uppercase">
                          {patient?.firstName?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="truncate">
                          <h3 className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight text-lg leading-none truncate">
                            {`${patient?.firstName} ${patient?.middleName || ""} ${patient?.lastName}`}
                          </h3>
                          <p className="text-xs font-black text-primary mt-1 tracking-widest">
                            {patient?.contact}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleView(patient)}
                            className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(patient)}
                            className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-red-500"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black uppercase tracking-tighter rounded-md text-zinc-500">
                          {patient.gender || "N/A"}
                        </span>
                        {patient.occupation && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-tighter rounded-md">
                            {patient.occupation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest text-[10px] opacity-50">
              No matching records found
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onSave={handleSavePatient}
        loading={loading}
      />
      <ViewPatientDetailsModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Delete Confirmation Glass Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <FiTrash2 size={32} />
            </div>
            <h3 className="font-black text-2xl text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
              Archive Record?
            </h3>
            <p className="py-4 text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              You are about to permanently delete{" "}
              <span className="text-zinc-900 dark:text-zinc-100 font-black">
                "{confirmModal.patient?.patientName}"
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-2 mb-6 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Authorization Required
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  name="action-confirmation"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter delete password"
                  className="w-full pl-12 pr-12 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold text-sm"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                onClick={() => {
                  setConfirmModal({ isOpen: false, patient: null });
                  setDeletePassword("");
                  setShowPassword(false);
                }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="flex-[2] bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-500/20 transition-all uppercase text-xs tracking-widest disabled:opacity-50 disabled:grayscale"
                onClick={handleDelete}
                disabled={deleteLoading || deletePassword !== REQUIRED_PASSWORD}
              >
                {deleteLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Confirm Purge"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
