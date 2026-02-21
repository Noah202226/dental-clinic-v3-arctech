"use client";
import { useState } from "react";
import { FiDollarSign, FiArrowRight } from "react-icons/fi";
import PaymentModal from "./PaymentModal";

export default function PaymentSectionCard({ patient }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Card View - Modern Glass Style */}
      <div
        onClick={() => setOpen(true)}
        className="group relative overflow-hidden bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer active:scale-[0.98]"
      >
        {/* Decorative Background Glow */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all" />

        <div className="flex flex-col h-full justify-between gap-4">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FiDollarSign size={24} />
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-zinc-400 group-hover:text-emerald-500 transition-colors">
              <FiArrowRight size={20} />
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
              Financial Records
            </h3>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              Payments & <span className="text-emerald-500">Billing</span>
            </h2>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Manage transactions, track pending balances, and generate billing
              statements.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <PaymentModal
        isOpen={open}
        onClose={() => setOpen(false)}
        patient={patient}
      />
    </>
  );
}
