import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Appointment } from "../types";
import { Plus, Trash, Edit, Check, Calendar, Phone, MapPin, User, ChevronLeft, Bookmark } from "lucide-react";

interface AppointmentsViewProps {
  selectedPatientId?: string; // Caregiver passive tracking
}

export default function AppointmentsView({ selectedPatientId }: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form State
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("General Physician");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");

  const currentUser = api.getCurrentUser();
  const isViewingAsCaregiver = !!selectedPatientId && currentUser?.role === "caregiver";

  useEffect(() => {
    fetchAppointments();
  }, [selectedPatientId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const list = await api.getAppointments(selectedPatientId || undefined);
      setAppointments(list);
    } catch (e) {
      console.error("Failed to fetch appointments:", e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDoctorName("");
    setSpecialty("General Physician");
    setDateTime("");
    setNotes("");
    setAddress("");
    setContact("");
    setStatus("scheduled");
    setIsEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !dateTime) {
      alert("Doctor Name and Date/Time are required.");
      return;
    }

    const payload = {
      doctorName,
      specialty,
      dateTime,
      notes,
      address,
      contact,
      status
    };

    try {
      if (isEditing) {
        await api.updateAppointment(isEditing, payload);
      } else {
        await api.createAppointment(payload);
      }
      resetForm();
      setShowAddForm(false);
      fetchAppointments();
    } catch (err: any) {
      alert("Error committing medical appointment details.");
    }
  };

  const handleEditClick = (apt: Appointment) => {
    setIsEditing(apt.id);
    setDoctorName(apt.doctorName);
    setSpecialty(apt.specialty);
    setDateTime(apt.dateTime);
    setNotes(apt.notes || "");
    setAddress(apt.address || "");
    setContact(apt.contact || "");
    setStatus(apt.status);
    setShowAddForm(true);
  };

  const handleToggleStatus = async (id: string, newStatus: "scheduled" | "completed" | "cancelled") => {
    try {
      await api.updateAppointment(id, { status: newStatus });
      fetchAppointments();
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this physician checkup record?")) return;
    try {
      await api.deleteAppointment(id);
      fetchAppointments();
    } catch (e) {
      alert("Failed to cancel checkup.");
    }
  };

  const sortedApts = appointments.sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  const upcomingApts = sortedApts.filter((a) => a.status === "scheduled");
  const pastApts = sortedApts.filter((a) => a.status !== "scheduled");

  return (
    <div id="appointments-wrapper" className="space-y-6">
      {/* Header Banner */}
      <div id="appointments-banner" className="flex justify-between items-center bg-white p-6 border border-slate-200/80 rounded-2xl">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Doctor Appointments</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {isViewingAsCaregiver 
              ? "Overseeing patient schedules with specialist heart physicians or cardiologists." 
              : "Verify upcoming sessions, record physician notes, and keep checkup locations handy."}
          </p>
        </div>

        {!isViewingAsCaregiver && !showAddForm && (
          <button
            id="new-appointment-btn"
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl cursor-pointer transition-all shadow-md shadow-teal-500/10"
          >
            <Plus size={16} />
            Add Schedule
          </button>
        )}
      </div>

      {/* Appointment Creation Form */}
      {showAddForm && (
        <form id="appointment-setup-form" onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-base">
              {isEditing ? "Modify Appointment Details" : "Record New Physician Session"}
            </h3>
            <button
              onClick={() => { setShowAddForm(false); resetForm(); }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Backward-to-logs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Doctor Name */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Doctor Name *</label>
              <input
                id="apt-doctor"
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Elizabeth Carter"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Medical Specialty</label>
              <input
                id="apt-specialty"
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Cardiology, Pediatrics, General"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {/* Date Time */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Appointment Schedule Time *</label>
              <input
                id="apt-datetime"
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {/* State status */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Status</label>
              <select
                id="apt-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none h-[38px]"
              >
                <option value="scheduled">Scheduled (Upcoming)</option>
                <option value="completed">Completed (Historic)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Clinic Address */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Clinic Address / Suite</label>
              <input
                id="apt-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Heart & Vascular Clinic, Suite 402"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {/* Contact telephone */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Doctor Contact Hotline</label>
              <input
                id="apt-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. (555) 123-4567"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Notes description */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Pre-Checkup Notes / Symptoms / Directives</label>
            <textarea
              id="apt-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Record blood pressure logs everyday for 2 weeks prior. Bring current prescription drugs labels."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              id="apt-submit-btn"
              type="submit"
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer hover:shadow-lg transition-all"
            >
              {isEditing ? "Save Session Changes" : "Commit New Session Record"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); resetForm(); }}
              className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl text-xs sm:text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main visual list directory split */}
      {!showAddForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Upcoming Appts Column (Take 2-thirds) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block animate-ping"></span> Upcoming checkups ({upcomingApts.length})
            </h2>

            {loading ? (
              <div className="p-12 text-center bg-white border border-slate-150 rounded-2xl">
                <span className="inline-block animate-spin h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full mb-2"></span>
                <p className="text-xs text-slate-400 font-semibold">Updating physician schedules...</p>
              </div>
            ) : upcomingApts.length === 0 ? (
              <div className="p-10 text-center bg-white border border-slate-200/80 rounded-2xl">
                <Calendar size={28} className="text-slate-300 mx-auto mb-2.5" />
                <p className="text-slate-400 font-semibold text-xs">No upcoming sessions on record.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingApts.map((apt) => {
                  const dateObj = new Date(apt.dateTime);
                  return (
                    <div key={apt.id} className="bg-white border border-slate-200/80 p-5 rounded-2xl hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-1">
                          <div>
                            <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5 capitalize">
                              {apt.specialty}
                            </span>
                            <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{apt.doctorName}</h3>
                          </div>
                          <span className="text-blue-800 font-black text-xs bg-blue-50/50 border border-blue-100 px-2 py-1 rounded-lg">
                            {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        <p className="text-xs text-blue-900 font-extrabold inline-flex items-center gap-1">
                          <Calendar size={13} />
                          <span>Hour: {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        </p>

                        <div className="space-y-1 text-xs text-slate-500 font-medium">
                          {apt.address && (
                            <p className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{apt.address}</span>
                            </p>
                          )}
                          {apt.contact && (
                            <p className="flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{apt.contact}</span>
                            </p>
                          )}
                        </div>

                        {apt.notes && (
                          <div className="bg-slate-50 border border-slate-100/80 p-2.5 rounded-xl">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Directives Check</span>
                            <p className="text-xs text-slate-500 leading-normal italic">{apt.notes}</p>
                          </div>
                        )}
                      </div>

                      {!isViewingAsCaregiver && (
                        <div className="flex gap-1.5 pt-3 border-t border-slate-50">
                          <button
                            id={`complete-apt-${apt.id}`}
                            onClick={() => handleToggleStatus(apt.id, "completed")}
                            className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold py-1.5 px-2.5 rounded-lg transition-all cursor-pointer flex-1 flex items-center justify-center gap-0.5"
                          >
                            <Check size={12} />
                            <span>Done</span>
                          </button>
                          <button
                            onClick={() => handleEditClick(apt)}
                            className="border border-slate-150 hover:bg-slate-50 text-slate-600 text-xs font-bold py-1.5 px-2 rounded-lg transition-all cursor-pointer flex-1 flex items-center justify-center gap-0.5"
                          >
                            <Edit size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="hover:bg-red-50 text-red-500 text-xs font-bold py-1.5 px-2 rounded-lg transition-all cursor-pointer flex-1 flex items-center justify-center gap-0.5"
                          >
                            <Trash size={12} />
                            <span>Purge</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past History Column (Take 1-third) */}
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Clinical History Log
            </h2>

            {pastApts.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold p-4 text-center bg-white border border-slate-150 rounded-2xl">No passed doctor checkups clocked.</p>
            ) : (
              <div className="space-y-3.5">
                {pastApts.map((apt) => {
                  const dObj = new Date(apt.dateTime);
                  const isCompleted = apt.status === "completed";
                  return (
                    <div key={apt.id} className="bg-white border border-slate-200/50 p-4 rounded-2xl space-y-2 hover:border-slate-300 transition-all opacity-85">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <p className="font-extrabold text-slate-700 text-xs sm:text-sm">{apt.doctorName}</p>
                          <p className="text-[10px] text-slate-400 font-medium capitalize">{apt.specialty}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm capitalize border ${
                          isCompleted 
                            ? "bg-slate-50 border-slate-200 text-slate-600" 
                            : "bg-red-50 border-red-100 text-red-600"
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500">
                        Date: {dObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {dObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
