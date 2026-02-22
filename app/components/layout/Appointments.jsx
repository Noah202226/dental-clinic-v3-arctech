"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  Loader2,
  Plus,
  Stethoscope,
  Trash2,
  User,
  Mail,
  X,
  AlertTriangle,
  Eye,
  FileText,
  Shield,
  Tag,
  ImageIcon,
  LayoutList,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  Info,
  ShieldCheck,
} from "lucide-react";
import { databases, client, storage, ID } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import clsx from "clsx";
import { notify } from "@/app/lib/notify";
import { Toaster } from "react-hot-toast";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  format,
} from "date-fns";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "appointments";
const BUCKET_ID = process.env.NEXT_PUBLIC_STORAGE_BUCKET_ID;
const PATIENT_COLLECTION_ID = "patients";

export default function AppointmentManager() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("Pending");
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [isDeleting, setIsDeleting] = useState(null); // Tracks the ID being deleted

  const [isUpdating, setIsUpdating] = useState(null); // Stores the $id of the event being updated

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayMode, setDisplayMode] = useState("calendar");

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleDelete = async (id) => {
    setIsDeleting(id);
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
      notify.success("Appointment removed");
      setDeleteId(null); // Close the confirmation dialog if you have one
      await fetchDocs();
      setSelectedEvent(null);
    } catch (e) {
      notify.error(e.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  // New State for Details Panel
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    email: "",
    date: "",
    notes: "",
    status: "pending",
  });

  const [rescheduleEvent, setRescheduleEvent] = useState(null);
  const [newDateValue, setNewDateValue] = useState("");

  const fetchDocs = useCallback(async () => {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.orderAsc("date"),
      ]);
      setEvents(res.documents.map((d) => ({ ...d, date: new Date(d.date) })));
    } catch (e) {
      console.error(e);
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

  const statusCounts = useMemo(
    () => ({
      Pending: events.filter((e) => e.status === "pending").length,
      Confirmed: events.filter((e) => e.status === "confirmed").length,
      Declined: events.filter((e) => e.status === "cancelled").length,
      All: events.length,
    }),
    [events],
  );

  const filteredEvents = useMemo(() => {
    // 1. Kunin ang base list base sa status
    let list;
    if (viewMode === "Pending") {
      list = events.filter((e) => e.status === "pending");
    } else if (viewMode === "Confirmed") {
      list = events.filter((e) => e.status === "confirmed");
    } else if (viewMode === "Declined") {
      list = events.filter((e) => e.status === "cancelled");
    } else {
      // Importante: laging mag-spread para gumawa ng shallow copy
      // para hindi magkaroon ng issues ang .sort()
      list = [...events];
    }

    // 2. Sorting Logic (Earliest to Latest)
    // Sinisiguro nito na kahit anong string format ang 'date',
    // iko-convert muna ito sa number (milliseconds) bago i-compare.
    return list.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeA - timeB; // Ascending order: 9am, 10am, 11am...
    });
  }, [events, viewMode]);

  // 3. Dahil naka-sort na ang filteredEvents,
  // automatic na susunod ang dailyAppointments sa pagkakasunod-sunod.
  const dailyAppointments = useMemo(() => {
    if (!selectedDate) return [];

    return filteredEvents.filter((e) =>
      isSameDay(new Date(e.date), selectedDate),
    );
  }, [filteredEvents, selectedDate]);

  const handleUpdateStatus = async (event, status, notes) => {
    // Set loading for this specific document
    setIsUpdating(event.$id);

    console.log("Selected event:", event);

    try {
      const eventDate = new Date(event.date);

      // 1. Update Appointment Status
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, event.$id, {
        status,
        dateKey: event.dateKey,
        time: event.time,
      });

      // 2. Save to Patients Collection if confirmed
      if (status === "confirmed" && !event.patientId) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            PATIENT_COLLECTION_ID,
            ID.unique(),
            {
              patientName: event.name || event.title || "Unknown Patient",
              email: event.email,
              firstName: event.firstName,
              lastName: event.lastName,
              middleName: event.middleName,
              contact: event.phone || "",
              birthdate: event.birthdate || "",
              gender: event.gender || "",
              civilStatus: event.civilStatus || "",
              occupation: event.occupation || "",
              address: event.address || "",
              emergencyToContact: event.emergencyToContact || "",
              emergencyToContactNumber: event.emergencyToContactNumber || "",
              note: notes || event.notes || "Initial record from booking.",
              photoFileId: event.photoFileId || "",

              medicalHistory: event.medicalHistory,
              referralSource: event.referralSource,
            },
          );
        } catch (patientErr) {
          console.warn("Patient creation error:", patientErr.message);
        }
      }

      // 3. Notification Logic
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: event.email,
            status,
            patientName: event.name || event.title,
            date: event.date, // Pass the date string
            time: event.time, // Pass the time string (e.g., "10:00 AM")
            notes: notes || event.notes || "No additional notes.",
          }),
        });
      } catch (nErr) {
        console.error("Notify fail", nErr);
      }

      // SUCCESS ACTIONS
      notify.success(`Appointment ${status}`);

      // --- FIX: Close the sidebar ---
      setSelectedEvent(null);

      // Refresh the list to show new data
      await fetchDocs();
    } catch (e) {
      notify.error(e.message);
    } finally {
      // Stop loading
      setIsUpdating(null);
    }
  };

  const handleSave = async () => {
    if (!newEvent.title || !newEvent.date)
      return notify.error("Missing required fields");
    setIsSaving(true);
    try {
      const selectedDate = new Date(newEvent.date);
      await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        title: newEvent.title,

        email: newEvent.email,
        date: selectedDate.toISOString(),
        dateKey: selectedDate.toISOString().split("T")[0],
        time: selectedDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        referralSource: "Clinic Entry",
        notes: newEvent.notes || "",
        status: newEvent.status,
      });
      notify.success("Patient record created");
      setShowModal(false);
      setNewEvent({
        title: "",
        email: "",
        date: "",
        notes: "",
        status: "pending",
      });
    } catch (e) {
      notify.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReappointSave = async () => {
    if (!newDateValue || !rescheduleEvent)
      return notify.error("Please select a new date and time.");

    const selectedDate = new Date(newDateValue);

    // Optimistic
    setEvents((prev) =>
      prev.map((e) =>
        e.$id === rescheduleEvent.$id
          ? { ...e, status: "pending", date: selectedDate }
          : e,
      ),
    );

    try {
      const dateKey = selectedDate.toISOString().split("T")[0];
      const time = selectedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        rescheduleEvent.$id,
        {
          status: "pending",
          date: selectedDate.toISOString(),
          dateKey,
          time,
        },
      );

      // Notify
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: rescheduleEvent.email,
          patientName: rescheduleEvent.title,
          date: selectedDate.toLocaleString(),
          status: "Rescheduled (Pending Review)",
          notes: rescheduleEvent.notes,
        }),
      });

      notify.success("Patient rescheduled.");
      setRescheduleEvent(null);
      setNewDateValue("");
      fetchDocs();
    } catch (e) {
      notify.error(`Update failed: ${e.message}`);
    }
  };

  const getImageUrl = (fileId) => {
    if (!fileId) return null;
    return storage.getFilePreview(BUCKET_ID, fileId);
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Synchronizing...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 transition-colors duration-300 relative overflow-x-hidden">
      {/* Header */}
      <div className="max-w-9xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
              <Stethoscope size={24} />
            </div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Appointments
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium ml-1">
            Manage patient schedules and clinic queue.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95 group"
        >
          <Plus
            size={18}
            className="group-hover:rotate-90 transition-transform"
          />
          <span className="uppercase tracking-widest text-xs">Add Patient</span>
        </button>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Custom Tabs */}
        <div className="flex flex-col xl:flex-col items-start xl:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
            <div className="overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
              <div className="flex p-1 bg-zinc-200/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-[1.5rem] w-fit border border-zinc-200 dark:border-zinc-800">
                {["Pending", "Confirmed", "Declined", "All"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setViewMode(tab)}
                    className={clsx(
                      "px-6 py-2.5 rounded-[1.2rem] text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3",
                      viewMode === tab
                        ? "bg-white dark:bg-zinc-800 text-primary dark:text-primary-400 shadow-sm"
                        : "text-zinc-500 hover:text-primary dark:hover:text-zinc-200",
                    )}
                  >
                    {tab}
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded-md text-[10px]",
                        viewMode === tab
                          ? "bg-primary-100 dark:bg-primary/10"
                          : "bg-zinc-200 dark:bg-zinc-800",
                      )}
                    >
                      {statusCounts[tab]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* NEW: DISPLAY MODE TOGGLE */}
            {/* <div className="flex items-center justify-between w-full md:w-auto gap-2">
              <button
                onClick={() => setDisplayMode("calendar")}
                className={clsx(
                  "p-2 rounded-xl transition-all",
                  displayMode === "calendar"
                    ? "bg-white dark:bg-zinc-800 text-primary-600 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600",
                )}
                title="Calendar View"
              >
                <CalendarIcon size={18} />
              </button>
              <button
                onClick={() => setDisplayMode("list")}
                className={clsx(
                  "p-2 rounded-xl transition-all",
                  displayMode === "list"
                    ? "bg-white dark:bg-zinc-800 text-primary-600 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600",
                )}
                title="List View"
              >
                <LayoutList size={18} />
              </button>
            </div> */}

            {/* MONTH NAVIGATION (Only shows in Calendar Mode) */}
            {displayMode === "calendar" && (
              <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-zinc-100 rounded-xl"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-sm font-black uppercase tracking-widest min-w-[140px] text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-zinc-100 rounded-xl"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="transition-all duration-500 w-full">
            {displayMode === "calendar" && !selectedDate ? (
              /* --- REGULAR CALENDAR GRID --- */
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
                  <div className="grid grid-cols-7 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="py-4 text-center text-[10px] font-black uppercase text-zinc-400"
                        >
                          {day}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="grid grid-cols-7">
                    {days.map((day) => {
                      const dayEvents = filteredEvents.filter((e) =>
                        isSameDay(new Date(e.date), day),
                      );
                      return (
                        <div
                          key={day.toString()}
                          onClick={() => {
                            if (dayEvents.length > 0) setSelectedDate(day);
                          }}
                          className={clsx(
                            "min-h-[80px] md:min-h-[120px] p-2 border-r border-b border-zinc-100 dark:border-zinc-800 transition-all cursor-pointer hover:bg-primary-50/30",
                            !isSameMonth(day, currentMonth) && "opacity-30",
                          )}
                        >
                          <span className="text-xs font-bold text-zinc-400">
                            {format(day, "d")}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dayEvents.slice(0, 3).map((e) => (
                              <div
                                key={e.$id}
                                className="w-full h-1.5 md:h-6 rounded-md bg-primary/10 border border-primary/20 hidden md:block px-2 text-[9px] font-bold text-primary-700 truncate"
                              >
                                {e.time} {e.title}
                              </div>
                            ))}
                            {/* Mobile Dot Indicators */}
                            <div className="flex gap-1 md:hidden">
                              {dayEvents.map((e) => (
                                <div
                                  key={e.$id}
                                  className="w-1.5 h-1.5 rounded-full bg-primary"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* --- DAY SELECTION MODE: Split View --- */
              <div className="flex flex-col lg:flex-row gap-6 animate-in slide-in-from-right-4 duration-500">
                {/* Left/Main Column: List of Appointments for that Day */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        setSelectedAppointment(null);
                      }}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter text-zinc-500 hover:text-primary transition-colors"
                    >
                      <ChevronLeft size={16} /> Back to Calendar
                    </button>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                      {selectedDate
                        ? format(selectedDate, "eeee, MMM do")
                        : "All Appointments"}
                    </h2>
                  </div>

                  <div className="grid gap-3">
                    {dailyAppointments.map((event) => (
                      <button
                        key={event.$id}
                        onClick={() => setSelectedAppointment(event)}
                        className={clsx(
                          "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                          selectedAppointment?.$id === event.$id
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-primary/50",
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={clsx(
                              "p-2.5 rounded-xl font-mono font-bold text-sm",
                              selectedAppointment?.$id === event.$id
                                ? "bg-white/20"
                                : "bg-zinc-100 dark:bg-zinc-800",
                            )}
                          >
                            {event.time}
                          </div>
                          <div>
                            <h4 className="font-bold leading-none">
                              {event.title}
                            </h4>
                            <p
                              className={clsx(
                                "text-xs mt-1",
                                selectedAppointment?.$id === event.$id
                                  ? "text-primary-100"
                                  : "text-zinc-500",
                              )}
                            >
                              {event.notes || "General Consultation"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className={
                            selectedAppointment?.$id === event.$id
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Column: Detail Sidebar */}
                <div className="lg:w-[600px] shrink-0">
                  {selectedAppointment ? (
                    <div className="sticky top-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
                      {/* Header: Status and ID */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-primary-100 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary-600 shadow-inner">
                          <User size={32} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={clsx(
                              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                              selectedAppointment.status === "confirmed"
                                ? "bg-primary text-white"
                                : "bg-amber-500 text-white",
                            )}
                          >
                            {selectedAppointment.status}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400 uppercase">
                            Ref: {selectedAppointment.$id.slice(-8)}
                          </span>
                        </div>
                      </div>

                      {/* Main Profile Info */}
                      <div className="mb-8">
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">
                          {selectedAppointment.title}
                        </h3>
                        <p className="text-primary-600 dark:text-primary-400 text-xs font-bold">
                          (
                          {selectedAppointment.occupation ||
                            "No occupation provided"}
                          )
                        </p>
                        <p className="text-primary-600 dark:text-primary-400 text-sm font-bold">
                          {selectedAppointment.address || "No address provided"}
                        </p>
                      </div>

                      {/* Detailed Data Grid */}
                      <div className="grid grid-cols-1 gap-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        {/* Contact Section */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                            Contact Details
                          </h4>
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                              <Mail size={16} />
                            </div>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {selectedAppointment.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                              <Phone size={16} />
                            </div>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {selectedAppointment.phone || "+1 (555) 000-0000"}
                            </p>
                          </div>
                        </div>

                        {/* Schedule Section */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                            Schedule
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <CalendarIcon
                                className="text-primary"
                                size={18}
                              />
                              <div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase">
                                  Date
                                </p>
                                <p className="text-xs font-black">
                                  {format(
                                    new Date(selectedAppointment.date),
                                    "MMM dd, yyyy",
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="text-primary" size={18} />
                              <div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase">
                                  Time
                                </p>
                                <p className="text-xs font-black">
                                  {selectedAppointment.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                            Patient Notes
                          </h4>
                          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                              {selectedAppointment.notes ||
                                "No additional notes provided by the patient."}
                            </p>
                          </div>
                        </div>

                        {/* MEDICAL HISTORY SECTION */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                            Medical History
                          </h4>
                          {selectedAppointment.medicalHistory &&
                          selectedAppointment.medicalHistory.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedAppointment.medicalHistory.map(
                                (item, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-[10px] font-black uppercase tracking-tight"
                                  >
                                    {item}
                                  </span>
                                ),
                              )}
                            </div>
                          ) : (
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                              <p className="text-xs text-zinc-400 italic text-center">
                                No medical history on record.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Audit Section */}
                        <div className="pt-4 flex items-center justify-between text-[10px] text-zinc-400 font-medium border-t border-zinc-100 dark:border-zinc-800 mt-2">
                          <span className="flex items-center gap-1">
                            <Info size={12} /> Created on{" "}
                            {format(
                              new Date(selectedAppointment.$createdAt),
                              "MM/dd/yy",
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck size={12} /> Verified Patient
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-1 gap-3 mt-10">
                        {selectedAppointment.status === "pending" ? (
                          /* CASE 1: Appointment is PENDING - Show Approve and Cancel */
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              disabled={isUpdating}
                              onClick={async () => {
                                setIsUpdating(true);
                                try {
                                  await handleUpdateStatus(
                                    selectedAppointment,
                                    "confirmed",
                                  );

                                  // SUCCESS: Itatago na ang sidebar preview
                                  setSelectedAppointment(null);
                                } catch (error) {
                                  console.error("Failed to approve:", error);
                                } finally {
                                  setIsUpdating(false);
                                }
                              }}
                              className="relative py-3.5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                              {isUpdating ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Loader2 className="animate-spin" size={14} />{" "}
                                  Processing...
                                </span>
                              ) : (
                                "Approve"
                              )}
                            </button>

                            <button
                              disabled={isUpdating}
                              onClick={async () => {
                                setIsUpdating(true);
                                try {
                                  await handleUpdateStatus(
                                    selectedAppointment,
                                    "cancelled",
                                  );
                                  // SUCCESS: Itatago na rin ang sidebar dito
                                  setSelectedAppointment(null);
                                } catch (error) {
                                  console.error("Failed to cancel:", error);
                                } finally {
                                  setIsUpdating(false);
                                }
                              }}
                              className="py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          /* CASE 2: Appointment is ALREADY PROCESSED - Show Close or Delete */
                          <div className="flex flex-col gap-3">
                            <button
                              disabled={isUpdating}
                              onClick={() => setSelectedAppointment(null)}
                              className="py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                              Close Preview
                            </button>

                            <button
                              disabled={isUpdating}
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this record permanently?",
                                  )
                                ) {
                                  setIsUpdating(true);
                                  try {
                                    await handleDelete(selectedAppointment.$id);
                                    setSelectedAppointment(null);
                                  } finally {
                                    setIsUpdating(false);
                                  }
                                }
                              }}
                              className="py-3.5 border border-red-500/20 bg-red-500/5 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isUpdating && (
                                <Loader2 className="animate-spin" size={14} />
                              )}
                              {isUpdating ? "Deleting..." : "Delete Record"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="sticky top-24 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center">
                      <div className="text-zinc-300 mb-4 flex justify-center">
                        <Eye size={48} />
                      </div>
                      <p className="text-zinc-500 font-bold">
                        Select an appointment to view full details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SLIDE-OVER DETAILS PANEL --- */}
      {selectedEvent && (
        <>
          {console.log("History Data:", selectedEvent?.medicalHistory)}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[480px] bg-white dark:bg-zinc-900 shadow-2xl p-0 flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-800">
            {/* Panel Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                  Patient Summary
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  ID: {selectedEvent.$id}
                </p>
              </div>
              <button
                onClick={() => {
                  // setSelectedEvent(null);

                  console.log("History Data:", selectedEvent?.medicalHistory);
                }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
              >
                <X size={24} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                    selectedEvent.status === "confirmed"
                      ? "bg-primary-100 text-primary-700"
                      : selectedEvent.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700",
                  )}
                >
                  {selectedEvent.status}
                </span>
                <span className="text-xs text-zinc-400 font-bold">
                  {selectedEvent.referralSource || "No Referral"}
                </span>
              </div>

              {/* Main Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {selectedEvent.title}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      {selectedEvent.email}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      {selectedEvent.phone || "No phone provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Time */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Clock size={12} /> Appointment Time
                </h4>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                      {new Date(selectedEvent.date).toLocaleDateString(
                        undefined,
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                    <p className="text-3xl font-black text-primary-600">
                      {selectedEvent.time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedEvent.notes && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={12} /> Notes / Reason
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 leading-relaxed">
                    {selectedEvent.notes}
                  </p>
                </div>
              )}

              {/* Medical History */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Stethoscope size={12} /> Medical History
                </h4>
                {selectedEvent.medicalHistory &&
                selectedEvent.medicalHistory.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.medicalHistory.map((condition, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-xs font-bold border border-red-100 dark:border-red-900/30"
                      >
                        {condition} + record
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic">
                    No medical history recorded.
                  </p>
                )}
              </div>

              {/* Insurance */}
              {/* <div className="space-y-3">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={12} /> Insurance
                </h4>
                {selectedEvent.insuranceCompany ? (
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase">
                        Provider
                      </p>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">
                        {selectedEvent.insuranceCompany}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-400 uppercase">
                        Policy No.
                      </p>
                      <p className="font-mono text-zinc-600 dark:text-zinc-400">
                        {selectedEvent.insurancePolicyNo}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic">
                    Self-pay / No insurance.
                  </p>
                )}
              </div> */}

              {/* Tags */}
              {selectedEvent.tags && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} /> Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.split(",").map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-bold uppercase"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Photo */}
              {selectedEvent.photoFileId && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={12} /> Attached Document
                  </h4>
                  <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(selectedEvent.photoFileId).toString()}
                      alt="Attached document"
                      className="w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer Actions */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col gap-4">
              {/* ROW 1: PRIMARY ACTIONS */}
              <div className="grid grid-cols-2 gap-4">
                {selectedEvent.status === "pending" && (
                  <>
                    <button
                      disabled={isUpdating === selectedEvent.$id}
                      onClick={() =>
                        handleUpdateStatus(selectedEvent, "confirmed")
                      }
                      className="py-4 bg-primary hover:bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {isUpdating === selectedEvent.$id ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />{" "}
                          Processing...
                        </>
                      ) : (
                        "Approve"
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(selectedEvent, "cancelled")
                      }
                      className="py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
                    >
                      Decline
                    </button>
                  </>
                )}

                {selectedEvent.status === "cancelled" && (
                  <button
                    onClick={() => {
                      setRescheduleEvent(selectedEvent);
                      setSelectedEvent(null);
                    }}
                    className="col-span-2 py-4 bg-zinc-900 dark:bg-zinc-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs"
                  >
                    Reschedule Patient
                  </button>
                )}

                {selectedEvent.status === "confirmed" && (
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="col-span-2 py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-300 transition-colors"
                  >
                    Close Summary
                  </button>
                )}
              </div>

              {/* ROW 2: DANGER ZONE (DELETE) */}
              {/* <div className="pt-2">
                <button
                  onClick={() => {
                    // Trigger your delete logic here
                    // Usually: setDeleteId(selectedEvent.$id)
                    // Then: setSelectedEvent(null)
                    setDeleteId(selectedEvent.$id);
                  }}
                  className="w-full py-3 flex items-center justify-center gap-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  <Trash2 size={14} />
                  Delete Appointment Record
                </button>
              </div> */}

              {/* Replace the existing Trash2 button logic */}
              {selectedEvent.status !== "pending" && (
                <button
                  onClick={() => handleDelete(selectedEvent.$id)}
                  disabled={isDeleting === selectedEvent.$id}
                  className={clsx(
                    "p-2.5 md:p-2 transition-colors",
                    isDeleting === selectedEvent.$id
                      ? "text-zinc-400"
                      : "text-zinc-300 hover:text-red-500",
                  )}
                >
                  {isDeleting === selectedEvent.$id ? (
                    <Loader2 size={18} className="animate-spin mx-auto" />
                  ) : (
                    <div className="w-full py-3 flex items-center justify-center gap-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                      <Trash2 size={18} className="mx-auto" />
                      Delete Appointment Record
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Existing Modals (Add/Reschedule/Delete) remain below... */}

      {/* MODAL: Add Patient */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="p-8 pb-0 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  New Clinic Entry
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  Manual Schedule System
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:border-primary outline-none transition-all dark:text-white"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:border-primary outline-none transition-all dark:text-white"
                  value={newEvent.email}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, email: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:border-primary outline-none text-xs dark:text-white"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">
                    Status
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl outline-none focus:border-primary text-xs dark:text-white"
                    value={newEvent.status}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, status: e.target.value })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1">
                  Visit Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl focus:border-primary outline-none resize-none dark:text-white"
                  value={newEvent.notes}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, notes: e.target.value })
                  }
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-5 bg-primary hover:bg-primary-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? "Processing..." : "Confirm Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reschedule */}
      {rescheduleEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] p-8 border border-primary/20 shadow-2xl shadow-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <Calendar size={20} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Reschedule Patient
              </h3>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-medium leading-relaxed">
              You are suggesting a new appointment time for{" "}
              <span className="text-primary font-bold">
                {rescheduleEvent.title}
              </span>
              . This will reset their status to{" "}
              <span className="italic font-semibold">pending</span>.
            </p>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase ml-1 tracking-widest">
                  Proposed Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 ring-primary/20 focus:border-primary outline-none dark:text-white transition-all"
                  value={newDateValue}
                  onChange={(e) => setNewDateValue(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRescheduleEvent(null);
                    setNewDateValue("");
                  }}
                  className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReappointSave}
                  disabled={!newDateValue}
                  className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-red-100 dark:border-red-900/20 shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Delete Record?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              This patient record will be permanently removed from the database.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 transition-all active:scale-95"
                onClick={() => handleDelete(deleteId)}
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}
