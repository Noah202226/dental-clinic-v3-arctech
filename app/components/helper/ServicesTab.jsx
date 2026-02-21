"use client";

import { useEffect, useState } from "react";
import { useServicesStore } from "@/app/stores/useServicesStore";
import { notify } from "@/app/lib/notify";
import { useBranding } from "../context/BrandingProvider"; // Added Branding

import {
  Trash2,
  PlusCircle,
  Search,
  Stethoscope,
  Tag,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";

export default function ServicesTab() {
  const { services, fetchServices, addService, deleteService, loading } =
    useServicesStore();
  const { config } = useBranding(); // Use dynamic config

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    serviceName: "",
    serviceDescription: "",
    servicePrice: "",
  });

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.serviceName || !form.servicePrice) {
      return notify.error("Please fill in required fields.");
    }

    try {
      await addService(form);
      notify.success("Service added successfully!");
      setShowModal(false);
      setForm({ serviceName: "", serviceDescription: "", servicePrice: "" });
    } catch (error) {
      notify.error("Failed to add service.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to remove this service?")) {
      await deleteService(id);
      notify.success("Service deleted successfully!");
    }
  };

  const filteredServices = services.filter((s) =>
    s.serviceName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading && services.length === 0)
    return (
      <div className="flex flex-col items-center py-20 text-primary">
        {" "}
        {/* Dynamic Color */}
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-black tracking-tight uppercase text-xs">
          Syncing Treatments...
        </p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Search & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search treatments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-5 py-3.5 bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:opacity-90 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm uppercase tracking-tight"
        >
          <PlusCircle size={18} /> Add Service
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map((srv) => (
            <div
              key={srv.$id}
              className="group relative p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-none"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  {" "}
                  {/* Dynamic Theme */}
                  <Stethoscope size={24} />
                </div>
                <button
                  onClick={() => handleDelete(srv.$id)}
                  className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div>
                <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-tight mb-1 uppercase tracking-tight">
                  {srv.serviceName}
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2 mb-4">
                  {srv.serviceDescription ||
                    "Comprehensive clinical treatment."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-primary font-black">
                  {" "}
                  {/* Dynamic Price Color */}
                  <Tag size={14} />
                  <span className="text-lg tracking-tighter">
                    ₱{parseFloat(srv.servicePrice).toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
                  Standard Rate
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
            <p className="text-zinc-400 font-bold italic">
              No matching treatments found.
            </p>
          </div>
        )}
      </div>

      {/* ✨ Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg border border-zinc-200 dark:border-zinc-800 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary rounded-lg text-white">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Add Treatment
              </h3>
            </div>

            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={form.serviceName}
                  onChange={(e) =>
                    setForm({ ...form, serviceName: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold"
                  placeholder="e.g. Tooth Extraction"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                  Price (₱)
                </label>
                <input
                  type="number"
                  required
                  value={form.servicePrice}
                  onChange={(e) =>
                    setForm({ ...form, servicePrice: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-black text-lg text-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                  Description
                </label>
                <textarea
                  value={form.serviceDescription}
                  onChange={(e) =>
                    setForm({ ...form, serviceDescription: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium h-24 resize-none"
                  placeholder="Briefly describe the procedure..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
              >
                Register Service
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
