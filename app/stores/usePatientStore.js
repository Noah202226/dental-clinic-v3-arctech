"use client";

import { create } from "zustand";
import { databases, ID } from "../lib/appwrite";
import { Query } from "appwrite";
import toast from "react-hot-toast";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const PATIENTS_COLLECTION_ID = "patients";
const TRANSACTIONS_COLLECTION_ID = "transactions"; // 👈 add this
const INSTALLMENTS_COLLECTION_ID = "installments"; // 👈 optional if used

export const usePatientStore = create((set, get) => ({
  patients: [],
  loading: false,

  // ✅ Fetch all patients
  fetchPatients: async () => {
    set({ loading: true });
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        PATIENTS_COLLECTION_ID,
        [Query.limit(3000)],
      );
      set({ patients: res.documents, loading: false });
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to fetch patients");
      set({ loading: false });
    }
  },

  // ✅ Add new patient
  addPatient: async (patientData) => {
    set({ loading: true });
    try {
      const res = await databases.createDocument(
        DATABASE_ID,
        PATIENTS_COLLECTION_ID,
        ID.unique(),
        patientData,
      );

      set((state) => ({
        patients: [...state.patients, res],
        loading: false,
      }));
    } catch (error) {
      console.error("Error adding patient:", error);

      set({ loading: false });
    }
  },

  // ✅ Update patient
  updatePatient: async (id, updates) => {
    set({ loading: true });
    try {
      const res = await databases.updateDocument(
        DATABASE_ID,
        PATIENTS_COLLECTION_ID,
        id,
        updates,
      );

      set((state) => ({
        patients: state.patients.map((p) => (p.$id === id ? res : p)),
        loading: false,
      }));
    } catch (error) {
      console.error("Error updating patient:", error);

      set({ loading: false });
    }
  },

  // ✅ Delete patient and related records
  deletePatient: async (id) => {
    set({ loading: true });
    try {
      // 1️⃣ Fetch related transactions
      const transactions = await databases.listDocuments(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        [Query.equal("patientId", id)],
      );

      console.log(id, transactions);

      // 2️⃣ Delete each transaction
      await Promise.all(
        transactions.documents.map((t) =>
          databases.deleteDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            t.$id,
          ),
        ),
      );

      // 3️⃣ (Optional) Delete related installments too
      try {
        const installments = await databases.listDocuments(
          DATABASE_ID,
          INSTALLMENTS_COLLECTION_ID,
          [Query.equal("patientId", id)],
        );

        await Promise.all(
          installments.documents.map((i) =>
            databases.deleteDocument(
              DATABASE_ID,
              INSTALLMENTS_COLLECTION_ID,
              i.$id,
            ),
          ),
        );
      } catch (e) {
        console.warn("No installments collection or records found");
      }

      // 4️⃣ Delete the patient document
      await databases.deleteDocument(DATABASE_ID, PATIENTS_COLLECTION_ID, id);

      // 5️⃣ Update local state
      set((state) => ({
        patients: state.patients.filter((p) => p.$id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error("Error deleting patient and related data:", error);

      set({ loading: false });
    }
  },
}));
