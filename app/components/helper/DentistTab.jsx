"use client";

import { useState, useEffect } from "react";
import { databases } from "@/app/lib/appwrite";
import { ID } from "appwrite";
import { motion } from "framer-motion";
import { Plus, Trash2, User, Phone, Mail, Building2 } from "lucide-react";
import toast from "react-hot-toast";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "dentists"; // Create this collection in Appwrite

export default function DentistTab() {
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
  });

  // Load dentists on mount
  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchDentists = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      setDentists(res.documents);
    } catch (error) {
      console.error("Error loading dentists:", error);
    } finally {
      setLoading(false);
    }
  };

  const addDentist = async () => {
    if (!form.name) return alert("Please enter dentist name.");

    toast.success("this features note yet available");
    // try {
    //   const res = await databases.createDocument(
    //     DATABASE_ID,
    //     COLLECTION_ID,
    //     ID.unique(),
    //     {
    //       name: form.name,
    //       email: form.email,
    //       phone: form.phone,
    //       specialization: form.specialization,
    //       createdAt: new Date().toISOString(),
    //     }
    //   );
    //   setDentists((prev) => [...prev, res]);
    //   setForm({ name: "", email: "", phone: "", specialization: "" });
    // } catch (error) {
    //   console.error("Error adding dentist:", error);
    //   alert("Failed to add dentist.");
    // }
  };

  const deleteDentist = async (id) => {
    if (!confirm("Delete this dentist?")) return;
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
      setDentists((prev) => prev.filter((d) => d.$id !== id));
    } catch (error) {
      console.error("Error deleting dentist:", error);
      alert("Failed to delete dentist.");
    }
  };

  return (
    <div className="p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
      >
        <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" /> Add Dentist / Doctor
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input input-bordered w-full"
              placeholder="Dr. John Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-700" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input input-bordered w-full"
                placeholder="dr.john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-700" />
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input input-bordered w-full"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Specialization
            </label>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-700" />
              <input
                type="text"
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="Orthodontist, Surgeon, etc."
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={addDentist}
            className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Dentist
          </button>
        </div>
      </motion.div>

      {/* Dentist List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-green-800 mb-4">
          Dentist List
        </h3>

        {loading ? (
          <p>Loading...</p>
        ) : dentists.length === 0 ? (
          <p className="text-gray-500 text-sm">No dentists added yet.</p>
        ) : (
          <div className="grid gap-4">
            {dentists.map((dentist) => (
              <div
                key={dentist.$id}
                className="flex justify-between items-center bg-green-50 rounded-lg p-4"
              >
                <div>
                  <p className="font-semibold text-green-900">{dentist.name}</p>
                  <p className="text-sm text-gray-600">
                    {dentist.specialization}
                  </p>
                  <p className="text-xs text-gray-500">
                    {dentist.email} | {dentist.phone}
                  </p>
                </div>
                <button
                  onClick={() => deleteDentist(dentist.$id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
