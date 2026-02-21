"use client";

import { useEffect, useState } from "react";
import { databases, ID } from "../../lib/appwrite";
import { Query } from "appwrite";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import dayjs from "dayjs";
import { notify } from "@/app/lib/notify";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_INSTALLMENTS = "installments";
const COLLECTION_TRANSACTIONS = "transactions";

const getCurrentDateTime = () => dayjs().format("YYYY-MM-DDTHH:mm");

export default function InstallmentsModal({ transaction, onClose }) {
  const today = new Date().toISOString().split("T")[0];

  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    amount: "",
    note: "",
    dateTransact: today,
  });

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_INSTALLMENTS,
        [
          Query.equal("transactionId", transaction.$id),
          Query.orderDesc("dateTransact"),
        ],
      );
      setInstallments(res.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transaction?.$id) fetchInstallments();
  }, [transaction]);

  const totalPaid = installments.reduce(
    (sum, i) => sum + Number(i.amount || 0),
    0,
  );
  const remaining = Math.max(transaction.totalAmount - totalPaid, 0);

  const handleDeleteInstallment = async (installment) => {
    if (
      !confirm(
        `Delete payment of ₱${Number(installment.amount).toLocaleString()}?`,
      )
    )
      return;

    try {
      setDeletingId(installment.$id);
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_INSTALLMENTS,
        installment.$id,
      );

      const newTotalPaid = totalPaid - Number(installment.amount);
      const newRemaining = Math.max(transaction.totalAmount - newTotalPaid, 0);

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        transaction.$id,
        {
          paid: newTotalPaid,
          remaining: newRemaining,
          status: newRemaining <= 0 ? "paid" : "ongoing",
        },
      );

      notify.success("Payment removed.");
      await fetchInstallments();
    } catch (err) {
      notify.error("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!form.amount) return;

    const newPaid = Number(form.amount);
    const newRemaining = Math.max(
      transaction.totalAmount - (totalPaid + newPaid),
      0,
    );

    try {
      setAdding(true);
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_INSTALLMENTS,
        ID.unique(),
        {
          transactionId: transaction.$id,
          amount: newPaid,
          dateTransact: form.dateTransact,
          remaining: newRemaining,
          serviceName: transaction.serviceName,
          note: form.note,
          patientName: transaction.patientName,
          patientId: transaction.patientId,
        },
      );

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        transaction.$id,
        {
          paid: totalPaid + newPaid,
          remaining: newRemaining,
          status: newRemaining <= 0 ? "paid" : "ongoing",
        },
      );

      notify.success("Payment added.");
      setForm({ amount: "", note: "", dateTransact: getCurrentDateTime() });
      await fetchInstallments();
    } catch (err) {
      notify.error("Failed to add payment.");
    } finally {
      setAdding(false);
    }
  };

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-zinc-950/60 backdrop-blur-md flex justify-center items-center p-4">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-xl rounded-[2.5rem] border border-white/20 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[75vh]">
        {/* Header */}
        <div className="px-8 py-6 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              Payment{" "}
              <span className="text-emerald-500 font-medium">Schedule</span>
            </h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
              Service: {transaction.serviceName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <FiX size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Financial Snapshot */}
        <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
          <StatBox
            label="Total Cost"
            value={transaction.totalAmount}
            color="text-zinc-900 dark:text-zinc-100"
          />
          <StatBox
            label="Paid to Date"
            value={totalPaid}
            color="text-emerald-500"
          />
          <StatBox label="To Settle" value={remaining} color="text-red-500" />
        </div>

        {/* Installment History Timeline */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white dark:bg-zinc-950 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-ring text-emerald-500"></span>
            </div>
          ) : installments.length === 0 ? (
            <p className="text-center text-[10px] font-black uppercase text-zinc-400 tracking-widest py-10">
              No payment history found
            </p>
          ) : (
            <div className="space-y-4">
              {installments.map((i) => (
                <div key={i.$id} className="group flex gap-4 relative">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <FiCheckCircle size={14} />
                    </div>
                    <div className="w-px h-full bg-zinc-100 dark:bg-zinc-800 mt-2"></div>
                  </div>

                  <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl transition-all group-hover:border-emerald-500/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                          ₱{Number(i.amount).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                          <FiCalendar />{" "}
                          {dayjs(i.dateTransact).format("MMM DD, YYYY")}
                          <FiClock className="ml-2" />{" "}
                          {dayjs(i.dateTransact).format("hh:mm A")}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteInstallment(i)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-300 hover:text-red-500 transition-all"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    {i.note && (
                      <p className="text-[11px] text-zinc-500 mt-2 italic leading-relaxed">
                        "{i.note}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Add Payment Form */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
          {remaining > 0 ? (
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Amount (₱)"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                  required
                  max={remaining}
                />
                <input
                  type="date"
                  value={form.dateTransact}
                  onChange={(e) =>
                    setForm({ ...form, dateTransact: e.target.value })
                  }
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Note (e.g. Check #, Promo code)"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all"
                />
                <button
                  disabled={adding}
                  className="px-6 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                >
                  {adding ? "..." : "Post"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-3 py-4 text-emerald-500">
              <FiCheckCircle size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Account Fully Settled
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="bg-white dark:bg-zinc-950 p-4 flex flex-col items-center">
      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">
        {label}
      </span>
      <span className={`text-sm font-black tracking-tight ${color}`}>
        ₱{Number(value).toLocaleString()}
      </span>
    </div>
  );
}
