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

      // Assuming each document is a record for one tooth (e.g., tooth 45 status)
      set({ items: res.documents, loading: false });
    } catch (err) {
      console.error("Fetch error:", err);
      set({ items: [] });
    } finally {
      set({ loading: false });
    }
  },

  // 📌 Update OR create tooth
  updateTooth: async (patientId, toothNumber, status, note) => {
    const tn = String(toothNumber);
    const items = get().items;

    // check if tooth already exists
    const existing = items.find((x) => x.toothNumber === tn);

    const data = {
      status: String(status),
      // Add new fields to the data object
      note: String(note),
    };

    try {
      if (existing) {
        // 👉 update existing tooth
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          existing.$id,
          data, // <--- Use the combined data object
        );
      } else {
        // 👉 create new tooth record
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            patientId: String(patientId),
            toothNumber: tn,
            ...data, // <--- Spread the new data fields
          },
        );
      }

      // refresh chart
      await get().fetchItems(patientId);
    } catch (err) {
      console.error("Update error:", err);
    }
  },

  // 📌 New: Delete Tooth
  deleteTooth: async (toothId) => {
    // Accept the Appwrite document ID
    set({ loading: true });
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, toothId);
      // After deleting, refresh the chart
      // You'll need the patientId to refetch, or manage state locally
      // For simplicity, let's assume we pass patientId or find it.
      // A better way is to filter the items array locally.
      set((state) => ({
        items: state.items.filter((item) => item.$id !== toothId),
      }));
      toast.success("Tooth record deleted successfully!");
    } catch (err) {
      console.error("Delete tooth error:", err);
      toast.error("Failed to delete tooth record.");
    } finally {
      set({ loading: false });
    }
  },
}));
