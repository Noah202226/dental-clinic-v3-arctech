import { create } from "zustand";
import { persist } from "zustand/middleware";
import { databases } from "../lib/appwrite";
import { Query, ID } from "appwrite";
import toast from "react-hot-toast";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;

export const createSectionStore = (collectionId, label) =>
  create(
    persist(
      (set, get) => ({
        items: [],
        loading: false,
        error: null,

        fetchItems: async (patientId) => {
          if (!patientId) return;
          set({ loading: true, error: null });
          try {
            const res = await databases.listDocuments(
              DATABASE_ID,
              collectionId,
              [Query.equal("patientId", patientId), Query.limit(1000)],
            );
            set({ items: res.documents });
          } catch (err) {
            console.error(`Error fetching ${label}:`, err);
            set({ error: err.message || "Failed to load data" });
            toast.error(`Failed to load ${label}`);
          } finally {
            set({ loading: false });
          }
        },

        // 🔹 Add item (dynamic form)
        addItem: async (patientId, data) => {
          if (!data || typeof data !== "object") {
            return toast.error("Invalid form data");
          }

          // Basic validation
          const hasAnyValue = Object.values(data).some(
            (v) => v !== "" && v !== null && v !== undefined,
          );
          if (!hasAnyValue) return toast.error("Please fill in the form.");

          set({ loading: true });
          try {
            const payload = {
              patientId,
              ...data, // ✅ merge dynamic form fields
            };

            const doc = await databases.createDocument(
              DATABASE_ID,
              collectionId,
              ID.unique(),
              payload,
            );

            set({ items: [doc, ...get().items] });
          } catch (err) {
            console.error(`Add ${label} failed:`, err);
            toast.error(`Failed to add ${label}`);
          } finally {
            set({ loading: false });
          }
        },

        // 🔹 Update item
        updateItem: async (id, data) => {
          if (!id || !data) return;
          set({ loading: true });
          try {
            const updated = await databases.updateDocument(
              DATABASE_ID,
              collectionId,
              id,
              data,
            );
            set({
              items: get().items.map((i) =>
                i.$id === id ? { ...i, ...updated } : i,
              ),
            });
          } catch (err) {
            console.error(`Update ${label} failed:`, err);
            toast.error(`Failed to update ${label}`);
          } finally {
            set({ loading: false });
          }
        },

        // 🔹 Delete item
        deleteItem: async (id) => {
          set({ loading: true });
          try {
            await databases.deleteDocument(DATABASE_ID, collectionId, id);
            set({ items: get().items.filter((i) => i.$id !== id) });
          } catch (err) {
            console.error(`Delete ${label} failed:`, err);
            toast.error("Delete failed");
          } finally {
            set({ loading: false });
          }
        },

        clear: () => set({ items: [], error: null }),
      }),
      {
        name: `${collectionId}-store`,
      },
    ),
  );
