"use client";
import { create } from "zustand";
import { databases, ID } from "../lib/appwrite";
import { Query } from "appwrite";
import toast from "react-hot-toast";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const TRANSACTIONS_COLLECTION_ID = "transactions";
const INSTALLMENTS_COLLECTION_ID = "installments";

export const usePaymentStore = create((set, get) => ({
  loading: false,
  transactions: [],
  installments: [],
  balance: 0,

  // 🔹 Fetch both full and installment payments for a patient
  fetchPayments: async (patientId) => {
    if (!patientId) return;
    set({ loading: true });

    try {
      const [txnRes, instRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, TRANSACTIONS_COLLECTION_ID, [
          Query.equal("patientId", patientId),
          [Query.limit(10000)],
        ]),
        databases.listDocuments(DATABASE_ID, INSTALLMENTS_COLLECTION_ID, [
          Query.equal("patientId", patientId),
          [Query.limit(10000)],
        ]),
      ]);

      const transactions = txnRes.documents || [];
      const installments = instRes.documents || [];

      // 💰 Calculate remaining balance (optional logic)
      const totalFull = transactions.reduce(
        (sum, t) => sum + parseFloat(t.amount || 0),
        0
      );
      const totalInstallments = installments.reduce(
        (sum, i) => sum + parseFloat(i.amount || 0),
        0
      );

      const totalPaid = totalFull + totalInstallments;

      // Optional: balance can come from treatment plan or a fixed value later
      set({
        transactions,
        installments,
        balance: totalPaid,
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
      toast.error("Failed to load payment data");
      set({ loading: false });
    }
  },

  // 🔹 Add a full payment
  addTransaction: async (patientId, amount, type = "Full Payment") => {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          patientId,
          transactionsType: type,
          amount: parseFloat(amount),
        }
      );
      set((state) => ({
        transactions: [...state.transactions, doc],
      }));
      toast.success("Full payment added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add transaction");
    }
  },

  // 🔹 Add an installment payment
  addInstallment: async (patientId, amount, dateTransact) => {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        INSTALLMENTS_COLLECTION_ID,
        ID.unique(),
        {
          patientId,
          amount: parseFloat(amount),
          dateTransact,
        }
      );
      set((state) => ({
        installments: [...state.installments, doc],
      }));
      toast.success("Installment added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add installment");
    }
  },
}));
