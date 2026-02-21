"use client";

import { useState } from "react";
import { useTransactionsStore } from "@/app/stores/useTransactionsStore";
import { useBranding } from "../context/BrandingProvider"; // 1. Added Branding Context
import { Trash2, PlusCircle, Loader2 } from "lucide-react";
import { FiTrendingDown, FiTag, FiX } from "react-icons/fi";
import { notify } from "@/app/lib/notify";
import clsx from "clsx";

export default function ExpensesTab() {
  const { config } = useBranding(); // 2. Access clinic branding
  const { expenses, deleteExpense, addExpense, loading } =
    useTransactionsStore();

  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "",
    amount: "",
    dateSpent: "",
  });

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount)
      return notify("error", "Fields required");

    try {
      await addExpense({
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        dateSpent: newExpense.dateSpent || new Date().toISOString(),
      });
      // 3. Fixed notify call
      notify.success("Expense added");
      setShowModal(false);
      setNewExpense({ title: "", category: "", amount: "", dateSpent: "" });
    } catch (error) {
      notify.error("Error:", error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.$id);
      // 3. Fixed notify call
      notify.error("Expense deleted");
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse text-zinc-400 font-black text-xs tracking-widest uppercase">
        Syncing Ledger...
      </div>
    );

  return (
    <div className="p-1">
      <div className="flex justify-between items-center px-8 py-6 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">
          Operational Outflow
        </h2>
        <button
          onClick={() => setShowModal(true)}
          // 4. Using dynamic primary color for the "NEW RECORD" button
          className="bg-primary hover:opacity-90 text-white px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg"
        >
          <PlusCircle size={14} /> NEW RECORD
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-zinc-50/50 dark:bg-transparent">
              <th className="px-8 py-4">Expense Title</th>
              <th className="px-8 py-4">Category</th>
              <th className="px-8 py-4 text-right">Amount</th>
              <th className="px-8 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {expenses.map((exp) => (
              <tr
                key={exp.$id}
                className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
              >
                <td className="px-8 py-5">
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                    {exp.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase">
                    {new Date(exp.dateSpent).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-[10px] font-black text-zinc-500 uppercase tracking-tighter">
                    {exp.category || "General"}
                  </span>
                </td>
                <td className="px-8 py-5 text-right font-black text-red-500 text-sm">
                  -₱{parseFloat(exp.amount).toLocaleString()}
                </td>
                <td className="px-8 py-5 text-center">
                  <button
                    onClick={() => {
                      setExpenseToDelete(exp);
                      setShowConfirm(true);
                    }}
                    className="text-zinc-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-primary dark:text-white">
                New Expense
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Description
                </label>
                <input
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-primary/20"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  placeholder="e.g. Dental Supplies"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                    Amount
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-primary/20"
                    value={newExpense.amount}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, amount: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-primary/20"
                    value={newExpense.dateSpent}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        dateSpent: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Category
                </label>
                <input
                  className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-primary/20"
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value })
                  }
                  placeholder="Marketing, Rent, etc."
                />
              </div>
              <button
                type="submit"
                // 4. Using dynamic text-primary if needed, otherwise standard dark/light
                className="w-full bg-primary dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-black text-sm mt-4 active:scale-95 transition-all"
              >
                SAVE TRANSACTION
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {showConfirm && (
        <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-black mb-2">Delete Record?</h3>
            <p className="text-sm text-zinc-500 font-medium mb-8">
              This action is permanent and will affect your{" "}
              {config?.name || "clinic"}'s net revenue calculations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-500 text-white rounded-xl font-black text-sm active:scale-95 transition-all py-3 flex items-center justify-center"
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "DELETE"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
