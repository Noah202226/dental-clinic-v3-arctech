"use client";

import { create } from "zustand";
import { databases, ID } from "@/app/lib/appwrite";
import toast from "react-hot-toast";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const PERSONALIZATION_COLLECTION_ID = "personalization";

export const usePersonalizationStore = create((set) => ({
  loading: false,
  personalization: null,
  error: null,

  // 🔹 Fetch personalization (single record)
  fetchPersonalization: async () => {
    set({ loading: true, error: null });
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PERSONALIZATION_COLLECTION_ID,
        [Query.limit(10000)],
      );

      // Expect only one document for personalization
      const record = response.documents[0] || null;
      set({ personalization: record, loading: false });
    } catch (err) {
      console.error("Error fetching personalization:", err);
      toast.error("Failed to load personalization settings.");
      set({ error: err, loading: false });
    }
  },

  // 🔹 Update or Create personalization
  savePersonalization: async (data) => {
    set({ loading: true });
    try {
      const existing = await databases.listDocuments(
        DATABASE_ID,
        PERSONALIZATION_COLLECTION_ID,
        [],
      );

      let result;
      if (existing.documents.length > 0) {
        // Update existing record
        const docId = existing.documents[0].$id;
        result = await databases.updateDocument(
          DATABASE_ID,
          PERSONALIZATION_COLLECTION_ID,
          docId,
          data,
        );
      } else {
        // Create new record
        result = await databases.createDocument(
          DATABASE_ID,
          PERSONALIZATION_COLLECTION_ID,
          ID.unique(),
          data,
        );
        toast.success("Personalization saved!");
      }

      set({ personalization: result, loading: false });
    } catch (err) {
      console.error("Error saving personalization:", err);
      toast.error("Failed to save personalization.");
      set({ error: err, loading: false });
    }
  },
}));
