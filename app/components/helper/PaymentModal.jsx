"use client";

import { useEffect, useState } from "react";
import { databases } from "../../lib/appwrite";
import { Query } from "appwrite";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiInfo,
  FiCreditCard,
  FiClock,
  FiCheckCircle,
  FiDownload,
} from "react-icons/fi";
import dayjs from "dayjs";
import NewTransactionModal from "./NewTransactionModal";
import InstallmentsModal from "./InstallmentsModal";
import { notify } from "@/app/lib/notify";
import { useBranding } from "@/app/components/context/BrandingProvider";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_TRANSACTIONS = "transactions";

// Modernized Confirmation Dialog
const ConfirmationDialog = ({ transaction, onConfirm, onCancel }) => {
  if (!transaction) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-red-500/20 shadow-2xl p-8 w-full max-w-sm">
        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight mb-2">
          Delete Transaction?
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          You are about to remove the record for{" "}
          <span className="text-zinc-900 dark:text-zinc-100 font-bold">
            {transaction.serviceName}
          </span>
          . This action is permanent.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
          >
            Confirm Deletion
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PaymentModal({ isOpen, onClose, patient }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalPaid: 0, totalRemaining: 0 });
  const [openNewModal, setOpenNewModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const { config } = useBranding();

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
      setSummary({
        totalPaid: docs.reduce((sum, t) => sum + Number(t.paid || 0), 0),
        totalRemaining: docs.reduce(
          (sum, t) => sum + Number(t.remaining || 0),
          0,
        ),
      });
      setTransactions(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      setLoading(true);
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        transactionToDelete.$id,
      );
      setTransactionToDelete(null);
      notify.success("Transaction deleted.");
      fetchTransactions();
    } catch (err) {
      notify.error("Delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      // Clinic Branding & Header
      doc.setFontSize(20);
      doc.setTextColor(24, 24, 27);
      doc.text(
        config?.businessName?.toUpperCase() || "Manila Dental Arst - Default",
        14,
        20,
      );

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Patient Ledger Statement", 14, 27);

      doc.setFontSize(9);
      doc.text(
        `Date Generated: ${dayjs().format("MMM DD, YYYY HH:mm")}`,
        196,
        20,
        { align: "right" },
      );

      // Patient Info Box
      doc.setDrawColor(230, 230, 230);
      doc.line(14, 32, 196, 32);

      doc.setFontSize(11);
      doc.setTextColor(40);
      doc.setFont(undefined, "bold");
      doc.text(
        `PATIENT: ${patient?.firstName?.toUpperCase()} ${patient?.middleName?.toUpperCase()}, ${patient?.lastName?.toUpperCase()}`,
        14,
        40,
      );

      // Financial Summary in PDF
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(
        `Total Settled: PHP ${summary.totalPaid.toLocaleString()}`,
        14,
        47,
      );
      doc.setTextColor(220, 38, 38); // Red for balance
      doc.text(
        `Outstanding Balance: PHP ${summary.totalRemaining.toLocaleString()}`,
        80,
        47,
      );
      doc.setTextColor(40);

      // Table Setup
      const tableColumn = [
        "Date",
        "Clinical Service",
        "Type",
        "Amount Paid",
        "Balance",
      ];
      const tableRows = transactions.map((t) => [
        dayjs(t.dateTransact || t.$createdAt).format("MMM DD, YYYY"),
        t.serviceName || "General Service",
        t.paymentType?.toUpperCase(),
        `PHP ${Number(t.paid || 0).toLocaleString()}`,
        `PHP ${Number(t.remaining || 0).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 55,
        head: [tableColumn],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129], fontSize: 9 }, // Emerald-500
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });

      doc.save(`Ledger_${patient?.patientName?.replace(/\s+/g, "_")}.pdf`);
      notify.success("PDF Ledger generated.");
    } catch (err) {
      console.error(err);
      notify.error("Failed to generate PDF.");
    }
  };

  useEffect(() => {
    if (isOpen && patient?.$id) fetchTransactions();
  }, [isOpen, patient]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/40 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white dark:bg-zinc-950 w-full h-full sm:h-[85vh] sm:max-w-4xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 dark:border-zinc-800">
        {/* Header */}
        <div className="px-8 py-6 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              Ledger{" "}
              <span className="text-emerald-500 font-medium">
                / {patient?.patientName}
              </span>
            </h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
              Transaction History
            </p>
          </div>

          <div className="flex gap-2">
            {/* PDF Download Button */}
            {transactions.length > 0 && (
              <button
                onClick={handleExportPDF}
                className="p-3 bg-primary dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                title="Download Ledger"
              >
                <FiDownload size={20} />
              </button>
            )}

            <button
              onClick={() => setOpenNewModal(true)}
              className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <FiPlus size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Financial Summary Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-900">
          <SummaryCard
            label="Settled Amount"
            value={summary.totalPaid}
            color="text-emerald-500"
          />
          <SummaryCard
            label="Outstanding Balance"
            value={summary.totalRemaining}
            color="text-red-500"
          />
          <SummaryCard
            label="Record Count"
            value={transactions.length}
            isCurrency={false}
            color="text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white dark:bg-zinc-950 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <span className="loading loading-ring loading-lg text-emerald-500"></span>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Syncing Records...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-[2rem]">
              <FiCreditCard className="mx-auto text-zinc-300 mb-4" size={40} />
              <p className="text-sm font-bold text-zinc-400">
                No transactions recorded yet.
              </p>
            </div>
          ) : (
            transactions.map((t) => (
              <div
                key={t.$id}
                className="group relative bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 p-5 rounded-2xl transition-all hover:border-emerald-500/30"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight text-sm">
                      {t.serviceName || "Clinical Service"}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <FiClock />{" "}
                        {dayjs(t.dateTransact || t.$createdAt).format(
                          "MMM DD, YYYY",
                        )}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md ${t.paymentType === "installment" ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}
                      >
                        {t.paymentType}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-600">
                      ₱{Number(t.paid || 0).toLocaleString()}
                    </p>
                    {t.remaining > 0 ? (
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        Balance: ₱{Number(t.remaining).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-end gap-1">
                        <FiCheckCircle /> Fully Settled
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center">
                  {t.paymentType === "installment" ? (
                    <button
                      onClick={() => setSelectedInstallment(t)}
                      className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-600 flex items-center gap-2"
                    >
                      Manage Installments <FiArrowRight />
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => setTransactionToDelete(t)}
                    className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Warning Note */}
          <div className="mt-8 p-4 bg-zinc-900 text-white rounded-2xl flex gap-4 items-start shadow-xl">
            <FiInfo className="text-emerald-400 shrink-0 mt-1" size={20} />
            <p className="text-[11px] font-medium leading-relaxed opacity-80">
              <span className="font-black uppercase tracking-widest text-emerald-400 block mb-1 text-[9px]">
                Data Integrity Note
              </span>
              To delete installment-based records, please use the{" "}
              <span className="text-emerald-400 font-bold">
                Installment Data List
              </span>{" "}
              to ensure all related payment schedules are synchronized
              correctly.
            </p>
          </div>
        </div>
      </div>

      {/* Nested Modals */}
      {openNewModal && (
        <NewTransactionModal
          patient={patient}
          onClose={() => setOpenNewModal(false)}
          onSaved={fetchTransactions}
          mainTransactionId={patient?.$id}
        />
      )}

      {selectedInstallment && (
        <InstallmentsModal
          transaction={selectedInstallment}
          onClose={() => setSelectedInstallment(null)}
        />
      )}

      <ConfirmationDialog
        transaction={transactionToDelete}
        onConfirm={executeDeleteTransaction}
        onCancel={() => setTransactionToDelete(null)}
      />
    </div>
  );
}

// Sub-component for summary cards
function SummaryCard({ label, value, color, isCurrency = true }) {
  return (
    <div className="bg-white dark:bg-zinc-950 p-6 flex flex-col items-center">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
        {label}
      </span>
      <span className={`text-xl font-black tracking-tight ${color}`}>
        {isCurrency ? `₱${value.toLocaleString()}` : value}
      </span>
    </div>
  );
}

function FiArrowRight() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="3"
      viewBox="0 0 24 24"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );
}
