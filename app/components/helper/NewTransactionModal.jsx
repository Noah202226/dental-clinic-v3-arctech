"use client";

import { useState, useEffect } from "react";
import { databases, ID } from "../../lib/appwrite";
import { FiX, FiInfo, FiPlusCircle, FiDollarSign } from "react-icons/fi";
import { useServicesStore } from "@/app/stores/useServicesStore";
import { notify } from "@/app/lib/notify";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_TRANSACTIONS = "transactions";
const COLLECTION_INSTALLMENTS = "installments";

export default function NewTransactionModal({ patient, onClose, onSaved }) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    serviceId: "",
    serviceName: "",
    servicePrice: 0,
    totalAmount: "",
    paymentType: "",
    initialPay: "",
    transactionDate: today,
  });

  const [loading, setLoading] = useState(false);
  const { services, fetchServices } = useServicesStore();

  useEffect(() => {
    fetchServices();
  }, []);

  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    const selectedService = services.find((s) => s.$id === selectedId);

    setForm((prev) => ({
      ...prev,
      serviceId: selectedService?.$id || "",
      serviceName: selectedService?.serviceName || "",
      servicePrice: selectedService?.servicePrice || 0,
      totalAmount: selectedService?.servicePrice || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const remainingBalance =
    form.paymentType === "installment"
      ? Math.max(form.servicePrice - Number(form.initialPay || 0), 0)
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const selectedDate = new Date(form.transactionDate).toISOString();

    try {
      const paidAmount =
        form.paymentType === "installment"
          ? Number(form.initialPay)
          : Number(form.totalAmount);

      const statusValue =
        paidAmount >= form.servicePrice
          ? "paid"
          : form.paymentType === "installment"
            ? "ongoing"
            : "unpaid";

      const transactionRes = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        ID.unique(),
        {
          patientId: patient.$id,
          patientName: patient.patientName,
          serviceId: form.serviceId,
          serviceName: form.serviceName,
          totalAmount: Number(form.servicePrice),
          paymentType: form.paymentType,
          paid: paidAmount,
          status: statusValue,
          remaining: remainingBalance,
          dateTransact: selectedDate,
        },
      );

      if (form.paymentType === "installment" && Number(form.initialPay) > 0) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_INSTALLMENTS,
          ID.unique(),
          {
            transactionId: transactionRes.$id,
            amount: Number(form.initialPay),
            dateTransact: new Date().toISOString(),
            patientId: patient.$id,
            patientName: patient.patientName,
            serviceName: form.serviceName,
            remaining: Number(form.servicePrice) - Number(form.initialPay),
            note: "Initial payment",
            dateTransact: selectedDate,
          },
        );
      }

      notify.success("Transaction recorded.");
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      notify.error("Failed to save transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-zinc-950/60 backdrop-blur-md flex justify-center items-center p-4">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              Create <span className="text-primary">Invoice</span>
            </h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
              For: {patient?.patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <FiX size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          {/* Service Picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
              Treatment / Service
            </label>
            <div className="relative">
              <select
                name="serviceId"
                value={form.serviceId}
                onChange={handleServiceChange}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-sm font-bold appearance-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                required
              >
                <option value="">Choose service...</option>
                {services.map((s) => (
                  <option key={s.$id} value={s.$id}>
                    {s.serviceName} — ₱{s.servicePrice.toLocaleString()}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <FiPlusCircle />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Payment Type
              </label>
              <select
                name="paymentType"
                value={form.paymentType}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-sm font-bold appearance-none outline-none focus:border-emerald-500 transition-all"
                required
              >
                <option value="">Select...</option>
                <option value="full">Full Payment</option>
                <option value="installment">Installment</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Transaction Date
              </label>
              <input
                type="date"
                name="transactionDate"
                value={form.transactionDate}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                required
              />
            </div>

            {/* Price Display */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[9px] font-black text-primary/80 uppercase tracking-widest">
                Unit Price
              </span>
              <span className="text-lg font-black text-primary">
                ₱{Number(form.servicePrice).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Installment Logic */}
          {form.paymentType === "installment" && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                  Initial Deposit (₱)
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input
                    type="number"
                    name="initialPay"
                    value={form.initialPay || ""}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Outstanding Balance
                </span>
                <span className="text-sm font-black text-red-500">
                  ₱{remainingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="p-4 bg-zinc-900 rounded-[1.5rem] flex gap-4 items-start shadow-xl">
            <FiInfo className="text-emerald-400 shrink-0 mt-1" size={18} />
            <p className="text-[10px] font-medium leading-relaxed text-zinc-400">
              <span className="text-white font-bold block mb-0.5">
                Note on Installments
              </span>
              Creating an installment record will automatically generate an
              initial entry in the payment schedule.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
            >
              {loading ? "Processing..." : "Authorize Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
