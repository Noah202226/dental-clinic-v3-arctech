"use client";

import { create } from "zustand";
import { ID, Query } from "appwrite";
import toast from "react-hot-toast";
import { databases } from "../lib/appwrite";

// 🔧 Replace with your database & collection IDs
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "services";

export const useServicesStore = create((set, get) => ({
  services: [],
  loading: false,

  // ✅ Fetch all services (No 25 limit)
  fetchServices: async () => {
    set({ loading: true });

    try {
      let allDocs = [];
      let cursor = undefined;
      const limit = 10000; // fetch chunks of 100 (Appwrite max)

      while (true) {
        const queries = [Query.limit(limit)];
        if (cursor) queries.push(Query.cursorAfter(cursor));

        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          queries,
        );

        allDocs = [...allDocs, ...res.documents];

        if (res.documents.length < limit) break; // No more documents to fetch

        cursor = res.documents[res.documents.length - 1].$id;
      }

      set({ services: allDocs });
    } catch (err) {
      console.error("Fetch services failed:", err);
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Add a new service
  addService: async (service) => {
    try {
      const priceRaw = service.servicePrice ?? service.price ?? "";
      const normalized = String(priceRaw).replace(/\s+/g, "").replace(",", ".");
      const price = parseFloat(normalized);

      if (!service.serviceName || !isFinite(price)) {
        throw new Error("Please provide a valid service name and price");
      }

      const payload = {
        serviceName: service.serviceName,
        serviceDescription: service.serviceDescription || "",
        servicePrice: price,
      };

      const res = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        payload,
      );

      set({ services: [res, ...get().services] });
    } catch (err) {
      console.error("Error adding service:", err);
    }
  },

  // ✅ Delete a service
  deleteService: async (id) => {
    try {
      if (!window.confirm("Are you sure you want to delete this service?"))
        return;

      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);

      set({ services: get().services.filter((s) => s.$id !== id) });
    } catch (err) {
      console.error("Delete service failed:", err);
    }
  },
}));
