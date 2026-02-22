"use client";
import { create } from "zustand";
import { databases, ID } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import toast from "react-hot-toast";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "dentalchart";

export const useDentalChartStore = create((set, get) => ({
  loading: false,
  items: [],

  // 📌 Fetch all teeth for the patient
  fetchItems: async (patientId) => {
    set({ loading: true });
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal("patientId", String(patientId)),
        Query.limit(100),
      ]);
      set({ items: res.documents, loading: false });
    } catch (err) {
      console.error("Fetch error:", err);
      set({ items: [], loading: false });
    }
  },

  // 📌 Generic Add: Matches SubSectionModal expectations
  addItem: async (patientId, data) => {
    try {
      const res = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...data,
          patientId: String(patientId),
          toothNumber: String(data.toothNumber), // Force String conversion
        },
      );
      set((state) => ({ items: [...state.items, res] }));
      return res;
    } catch (err) {
      console.error("Add error:", err);
      throw err;
    }
  },

  // 📌 Generic Update: Matches SubSectionModal expectations
  updateItem: async (itemId, data) => {
    try {
      // If toothNumber is in the update payload, ensure it's a string
      const updatedData = { ...data };
      if (updatedData.toothNumber) {
        updatedData.toothNumber = String(updatedData.toothNumber);
      }

      const res = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        itemId,
        updatedData,
      );
      set((state) => ({
        items: state.items.map((item) => (item.$id === itemId ? res : item)),
      }));
      return res;
    } catch (err) {
      console.error("Update error:", err);
      throw err;
    }
  },

  // 📌 Generic Delete: Matches SubSectionModal expectations
  deleteItem: async (itemId) => {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, itemId);
      set((state) => ({
        items: state.items.filter((item) => item.$id !== itemId),
      }));
      toast.success("Tooth record removed");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete record");
      throw err;
    }
  },

  // Add this inside your create((set, get) => ({ ... })) block
  clearChart: async (patientId) => {
    set({ loading: true });
    const { items } = get();

    try {
      // Delete all documents found for this patient
      const deletePromises = items.map((item) =>
        databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_ID,
          item.$id, // Uses the unique document ID from Appwrite
        ),
      );

      await Promise.all(deletePromises);

      // Clear local state so the UI updates immediately
      set({ items: [], loading: false });
      toast.success("All records cleared for this patient.");
    } catch (err) {
      console.error("Clear Error:", err);
      toast.error("Failed to clear records.");
      set({ loading: false });
    }
  },
}));
