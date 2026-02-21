"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Trash2,
} from "lucide-react";
import { databases, client, ID } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import toast, { Toaster } from "react-hot-toast";
import { useBranding } from "../context/BrandingProvider"; // Added Branding Context
import { notify } from "@/app/lib/notify";

/* ----------------------------------------------------------
    Helper Functions
---------------------------------------------------------- */
const formatDate = (dateInput) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isSameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
const isSameMonth = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth();

/* ----------------------------------------------------------
    Sub-Component: Event Card
---------------------------------------------------------- */
const EventCard = ({ event, handleDelete }) => (
  <div className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-center">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
              event.public
                ? "bg-primary/10 text-primary"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {event.public ? "Public" : "Private"}
          </span>
          <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
            <Clock size={12} /> {event.duration}m
          </span>
        </div>
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
          {event.title}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
          {formatDate(event.date)}
        </p>
      </div>

      <button
        onClick={() => handleDelete(event.$id)}
        className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>
);

/* ----------------------------------------------------------
    Sub-Component: Calendar Grid
---------------------------------------------------------- */
const CalendarComponent = ({ events, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const days = useMemo(() => {
    const start = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const startDay = start.getDay();
    const arr = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(1 - startDay + i);
      arr.push(d);
    }
    return arr;
  }, [currentMonth]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1,
                  1,
                ),
              )
            }
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1,
                ),
              )
            }
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-[10px] font-bold text-zinc-300 py-2"
          >
            {d}
          </div>
        ))}
        {days.map((date, i) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const hasEvents = events.some((e) => isSameDay(e.date, date));
          const isDiffMonth = date.getMonth() !== currentMonth.getMonth();

          return (
            <button
              key={i}
              onClick={() => onDateSelect(date)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all text-xs font-semibold
                ${isDiffMonth ? "opacity-20" : "opacity-100"}
                ${isSelected ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}
                ${isToday && !isSelected ? "text-primary border border-primary/20" : ""}
              `}
            >
              {date.getDate()}
              {hasEvents && !isSelected && (
                <span className="absolute bottom-1.5 w-1 h-1 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
    MAIN APPLICATION
---------------------------------------------------------- */
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "schedules";

export default function App() {
  const { config } = useBranding(); // Access branding
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    duration: "30",
    public: false,
  });

  const fetchDocs = useCallback(async () => {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.orderAsc("date"),
      ]);
      setEvents(res.documents.map((d) => ({ ...d, date: new Date(d.date) })));
    } catch (e) {
      toast.error("Connection Error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
    const unsub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
      fetchDocs,
    );
    return () => unsub();
  }, [fetchDocs]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (viewMode === "day") return isSameDay(e.date, selectedDate);
      if (viewMode === "month") return isSameMonth(e.date, selectedDate);
      if (viewMode === "year")
        return e.date.getFullYear() === selectedDate.getFullYear();
      return true;
    });
  }, [events, selectedDate, viewMode]);

  const handleSave = async () => {
    // 1. Client-side validation
    if (!newEvent.title || !newEvent.date) {
      return notify("error", "Please provide both a title and a date.");
    }

    setIsSaving(true);
    try {
      // 2. Explicitly map data to match Appwrite Attributes
      const payload = {
        title: newEvent.title.trim(),
        date: new Date(newEvent.date).toISOString(),
        duration: String(newEvent.duration),
        public: Boolean(newEvent.public),
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        payload,
      );

      notify.success(`New Task saved: ${newEvent.title.trim()}`);
      setShowModal(false);

      // Reset form
      setNewEvent({ title: "", date: "", duration: 30, public: false });
    } catch (error) {
      // 3. Log the specific Appwrite error (e.g., 'Attribute not found' or 'Invalid permissions')
      console.error("Appwrite Save Error:", error);

      // Provide user-friendly feedback based on the server response
      const errorMessage = error.message || "Could not save to the database.";
      notify("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, deleteId);
      toast.success("Entry Deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <Toaster position="bottom-right" />

      {/* Header Section */}
      <header className="max-w-9xl mx-auto p-6 lg:px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <ClipboardList className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase">
              Task <span className="text-primary">Scheduler</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {["day", "month", "year"].map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  viewMode === m
                    ? "bg-white dark:bg-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-9xl mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Calendar */}
        <aside className="lg:col-span-4 space-y-6">
          <CalendarComponent
            events={events}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          <button
            onClick={() => setShowModal(true)}
            className="w-full py-4 bg-primary hover:opacity-90 text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-primary/10 transition-transform active:scale-95"
          >
            <Plus size={18} /> New Task
          </button>
        </aside>

        {/* Right Side: Event List */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              {viewMode} View:{" "}
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
                day: viewMode === "day" ? "numeric" : undefined,
              })}
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              {filteredEvents.length} Tasks
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard
                  key={event.$id}
                  event={event}
                  handleDelete={setDeleteId}
                />
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center opacity-30">
                <CalendarIcon size={64} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">
                  No Records Found
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">
              New Task
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task Title"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
              />
              <input
                type="datetime-local"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
              />
              <div className="flex gap-4">
                <select
                  className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none"
                  value={newEvent.duration}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      duration: parseInt(e.target.value),
                    })
                  }
                >
                  {[15, 30, 45, 60, 90, 120].map((v) => (
                    <option key={v} value={v}>
                      {v} Min
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl cursor-pointer">
                  <span className="text-xs font-bold uppercase text-zinc-400">
                    Public
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-primary"
                    checked={newEvent.public}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, public: e.target.checked })
                    }
                  />
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-sm font-bold uppercase text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                >
                  {isSaving ? "Saving..." : "Create Entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-red-100 dark:border-red-900/20 shadow-2xl text-center max-w-sm">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">Confirm Delete</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 italic">
              This action will remove the record from the clinical database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 font-bold uppercase text-xs text-zinc-400"
              >
                Back
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold uppercase text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
