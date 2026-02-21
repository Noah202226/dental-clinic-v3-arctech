"use client";

import { create } from "zustand";
import { databases, ID } from "../lib/appwrite";
import toast from "react-hot-toast";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const TRANSACTIONS_COLLECTION_ID = "transactions";
const INSTALLMENTS_COLLECTION_ID = "installments";
const EXPENSES_COLLECTION_ID = "expenses"; // 🆕 Add this

export const useTransactionsStore = create((set, get) => ({
  loading: false,
  transactions: [],
  installments: [],
  expenses: [], // 🆕
  error: null,
  withBalancePatients: [],

  getWithBalancePatients: async () => {
    set({ loading: true, error: null });
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        [
          // 1. Server-side filter: Only get items where remaining is > 0
          // Query.greaterThan("remaining", 0),

          // 2. Increase limit: Fetch up to 100 (or more) active balances
          Query.limit(1000),
        ]
      );
      const patients = res.documents.filter((txn) => txn.remaining > 0);
      set({ withBalancePatients: patients, loading: false });
    } catch (err) {
      console.error("Error fetching patients with balance:", err);
      toast.error("Failed to load patients with balance");
      set({ error: err, loading: false });
    }
  },

  // 🔹 Fetch all transactions, installments, and expenses
  fetchAllPayments: async () => {
    set({ loading: true, error: null });

    try {
      const [txnRes, instRes, expRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, TRANSACTIONS_COLLECTION_ID, [
          Query.limit(10000),
        ]),
        databases.listDocuments(DATABASE_ID, INSTALLMENTS_COLLECTION_ID, [
          Query.limit(10000),
        ]),
        databases.listDocuments(DATABASE_ID, EXPENSES_COLLECTION_ID, [
          Query.limit(10000),
        ]),
      ]);

      set({
        transactions: txnRes.documents || [],
        installments: instRes.documents || [],
        expenses: expRes.documents || [],
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data");
      set({ error: err, loading: false });
    }
  },

  // 🔹 Add new full transaction
  addTransaction: async (data) => {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        data
      );
      set((state) => ({
        transactions: [...state.transactions, doc],
      }));
      toast.success("Transaction added");
    } catch (err) {
      console.error("Error adding transaction:", err);
      toast.error("Failed to add transaction");
    }
  },

  // 🔹 Add new installment
  addInstallment: async (data) => {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        INSTALLMENTS_COLLECTION_ID,
        ID.unique(),
        data
      );
      set((state) => ({
        installments: [...state.installments, doc],
      }));
      toast.success("Installment added");
    } catch (err) {
      console.error("Error adding installment:", err);
      toast.error("Failed to add installment");
    }
  },

  // 🔹 Add new expense
  addExpense: async (data) => {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        EXPENSES_COLLECTION_ID,
        ID.unique(),
        data
      );
      set((state) => ({
        expenses: [...state.expenses, doc],
      }));
      toast.success("Expense added");
    } catch (err) {
      console.error("Error adding expense:", err);
      toast.error("Failed to add expense");
    }
  },

  // 🔹 Delete transaction
  deleteTransaction: async (id) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        id
      );
      set((state) => ({
        transactions: state.transactions.filter((t) => t.$id !== id),
      }));
      toast.success("Transaction deleted");
    } catch (err) {
      console.error("Error deleting transaction:", err);
      toast.error("Failed to delete transaction");
    }
  },

  // 🔹 Delete installment
  deleteInstallment: async (id) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        INSTALLMENTS_COLLECTION_ID,
        id
      );
      set((state) => ({
        installments: state.installments.filter((i) => i.$id !== id),
      }));
      toast.success("Installment deleted");
    } catch (err) {
      console.error("Error deleting installment:", err);
      toast.error("Failed to delete installment");
    }
  },

  // 🔹 Delete expense
  deleteExpense: async (id) => {
    try {
      await databases.deleteDocument(DATABASE_ID, EXPENSES_COLLECTION_ID, id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.$id !== id),
      }));
      toast.success("Expense deleted");
    } catch (err) {
      console.error("Error deleting expense:", err);
      toast.error("Failed to delete expense");
    }
  },

  // 🔹 Unified delete for all payment types (used in Reports)
  deletePayment: async (id, type) => {
    try {
      const collectionId =
        type === "Installment"
          ? INSTALLMENTS_COLLECTION_ID
          : type === "Expense"
          ? EXPENSES_COLLECTION_ID
          : TRANSACTIONS_COLLECTION_ID;

      await databases.deleteDocument(DATABASE_ID, collectionId, id);

      set((state) => ({
        transactions: state.transactions.filter((t) => t.$id !== id),
        installments: state.installments.filter((i) => i.$id !== id),
        expenses: state.expenses.filter((e) => e.$id !== id),
      }));

      toast.success(`${type} deleted successfully`);
    } catch (err) {
      console.error("Error deleting record:", err);
      toast.error("Failed to delete record");
    }
  },

  // 🔹 Stats summary (Revenue + Expenses)
  getStats: () => {
    const { transactions, installments, expenses } = get();

    const totalRevenue = [...transactions, ...installments].reduce(
      (sum, p) => sum + parseFloat(p.amount || 0),
      0
    );
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount || 0),
      0
    );
    const totalTransactions = transactions.length;
    const totalInstallments = installments.length;
    const totalExpenseItems = expenses.length;
    const netRevenue = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      totalTransactions,
      totalInstallments,
      totalExpenseItems,
      netRevenue,
    };
  },
}));
