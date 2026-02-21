"use client";

import { useEffect, useMemo, useState } from "react";
import { useTransactionsStore } from "@/app/stores/useTransactionsStore";
import { useBranding } from "../context/BrandingProvider"; // 1. Added Branding Context
import {
  FiDownload,
  FiArrowUpRight,
  FiArrowDownRight,
  FiActivity,
  FiPieChart,
} from "react-icons/fi";
import clsx from "clsx";
import ExpensesTab from "../helper/ExpensesTab";
import { notify } from "@/app/lib/notify";

export default function ReportsAnalytics() {
  const { config } = useBranding(); // 2. Access clinic branding
  const { transactions, installments, fetchAllPayments, loading, expenses } =
    useTransactionsStore();

  const getMonthBounds = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 2);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const formatDate = (date) => date.toISOString().split("T")[0];

    return { from: formatDate(firstDay), to: formatDate(lastDay) };
  };

  const [dateRange, setDateRange] = useState(getMonthBounds());
  const [activeTab, setActiveTab] = useState("Sales");

  useEffect(() => {
    fetchAllPayments();
  }, [fetchAllPayments]);

  const allIndividualPayments = useMemo(() => {
    const combined = [
      ...transactions
        .filter((t) => t.paymentType !== "installment")
        .map((t) => ({
          id: t.$id,
          type: "Full",
          amount: parseFloat(t.totalAmount || 0),
          date: new Date(t.$createdAt),
          patientName: t.patientName,
          remaining: 0,
        })),
      ...installments.map((i) => ({
        id: i.$id,
        type: "Installment",
        amount: parseFloat(i.amount || 0),
        date: new Date(i.dateTransact || i.$createdAt),
        patientName: i.patientName,
        remaining: parseFloat(i.remaining || 0),
      })),
    ];

    return combined
      .filter((p) => {
        if (!dateRange.from && !dateRange.to) return true;
        const date = p.date.getTime();
        const from = dateRange.from
          ? new Date(dateRange.from).setHours(0, 0, 0, 0)
          : -Infinity;
        const to = dateRange.to
          ? new Date(dateRange.to).setHours(23, 59, 59, 999)
          : Infinity;
        return date >= from && date <= to;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, installments, dateRange]);

  const totalCashReceived = allIndividualPayments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const totalExpenses = expenses.reduce(
    (s, ex) => s + parseFloat(ex.amount || 0),
    0,
  );
  const netRevenue = totalCashReceived - totalExpenses;

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();

      console.log(config);

      // 3. Personalized PDF Branding
      doc.setFontSize(22);
      doc.setTextColor(20, 20, 20);
      doc.text(
        config?.businessName?.toUpperCase() || "Manila Dental Arts",
        14,
        20,
      );

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Financial Audit Summary Report", 14, 27);

      doc.setFontSize(9);
      doc.text(`Generated: ${timestamp}`, 196, 20, { align: "right" });
      doc.text(`Clinic ID: ${config?.clinicId || "N/A"}`, 196, 25, {
        align: "right",
      });
      doc.text(
        `Range: ${dateRange.from || "All Time"} — ${dateRange.to || "Present"}`,
        196,
        30,
        { align: "right" },
      );

      doc.setDrawColor(230, 230, 230);
      doc.line(14, 35, 196, 35);

      // Summary
      const reportCash = allIndividualPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      const reportExp = expenses.reduce(
        (s, ex) => s + parseFloat(ex.amount || 0),
        0,
      );
      const reportNet = reportCash - reportExp;

      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.setFont(undefined, "bold");
      doc.text("EXECUTIVE SUMMARY", 14, 45);

      doc.setFont(undefined, "normal");
      doc.text(`Gross Revenue: PHP ${reportCash.toLocaleString()}`, 14, 52);
      doc.text(`Total Expenses: PHP ${reportExp.toLocaleString()}`, 80, 52);
      doc.setTextColor(16, 185, 129);
      doc.text(`Net Profit: PHP ${reportNet.toLocaleString()}`, 140, 52);

      const tableColumn =
        activeTab === "Sales"
          ? ["Date", "Patient Name", "Payment Type", "Credit Amount", "Balance"]
          : ["Date", "Expense Description", "Category", "Debit Amount"];

      const tableRows =
        activeTab === "Sales"
          ? allIndividualPayments.map((p) => [
              p.date.toLocaleDateString(),
              p.patientName?.toUpperCase(),
              p.type,
              `PHP ${p.amount.toLocaleString()}`,
              p.remaining > 0
                ? `PHP ${p.remaining.toLocaleString()}`
                : "SETTLED",
            ])
          : expenses.map((e) => [
              new Date(e.dateSpent).toLocaleDateString(),
              e.title,
              e.category || "General",
              `PHP ${parseFloat(e.amount).toLocaleString()}`,
            ]);

      autoTable(doc, {
        startY: 60,
        head: [tableColumn],
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: activeTab === "Sales" ? [16, 185, 129] : [239, 68, 68],
          fontSize: 9,
        },
        styles: { fontSize: 8, cellPadding: 4 },
      });

      doc.save(`${config?.name || "Clinic"}_${activeTab}_Report.pdf`);

      // 4. Fixed notify calls
      notify("success", "PDF report generated successfully");
    } catch (err) {
      console.error(err);
      notify("error", "Failed to generate PDF report");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-zinc-50/50 dark:bg-transparent">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3 uppercase">
            <FiActivity className="text-primary" />
            {/* 5. Personalized UI Header */}
            {config?.name?.split(" ")[0] || "Ledger"}{" "}
            <span className="text-primary">
              {config?.name?.split(" ")[1] || "Hub"}
            </span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">
            Financial analytics for {config?.name || "your clinic"}.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl active:scale-95"
        >
          <FiDownload size={18} /> Generate PDF
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Gross Revenue",
            val: totalCashReceived,
            color: "text-emerald-500",
            icon: <FiArrowUpRight />,
          },
          {
            label: "Total Expenses",
            val: totalExpenses,
            color: "text-red-500",
            icon: <FiArrowDownRight />,
          },
          {
            label: "Net Revenue",
            val: netRevenue,
            color: "text-primary",
            icon: <FiPieChart />,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-sm"
          >
            <div
              className={clsx(
                "absolute -right-4 -top-4 text-7xl opacity-5 rotate-12 transition-transform group-hover:scale-110",
                stat.color,
              )}
            >
              {stat.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {stat.label}
            </span>
            <h2
              className={clsx(
                "text-4xl font-black mt-2 tracking-tighter",
                stat.color,
              )}
            >
              ₱
              {stat.val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
        ))}
      </div>

      {/* TABS & TABLE */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
          <div className="flex p-1.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl w-fit backdrop-blur-md border border-zinc-200 dark:border-zinc-700">
            {["Sales", "Expenses"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={clsx(
                  "px-10 py-2.5 rounded-xl font-black text-xs transition-all",
                  activeTab === t
                    ? "bg-white dark:bg-zinc-100 text-zinc-900 shadow-lg"
                    : "text-zinc-500",
                )}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <input
              type="date"
              className="bg-transparent border-none text-xs font-bold focus:ring-0 text-zinc-600 dark:text-zinc-300"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
            />
            <span className="text-zinc-300">/</span>
            <input
              type="date"
              className="bg-transparent border-none text-xs font-bold focus:ring-0 text-zinc-600 dark:text-zinc-300"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {activeTab === "Sales" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      Transaction
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      Patient
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">
                      Credit
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {allIndividualPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                          {p.date.toLocaleDateString()}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase">
                          {p.type}
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-zinc-900 dark:text-white uppercase text-xs tracking-tight">
                        {p.patientName}
                      </td>
                      <td className="px-8 py-5 text-right font-black text-emerald-500 text-sm">
                        +₱{p.amount.toLocaleString()}
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-zinc-400 text-xs">
                        {p.remaining > 0 ? (
                          <span className="text-red-400">
                            ₱{p.remaining.toLocaleString()}
                          </span>
                        ) : (
                          "SETTLED"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ExpensesTab />
          )}
        </div>
      </div>
    </div>
  );
}
