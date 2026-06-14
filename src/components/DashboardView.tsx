import { useState, useEffect } from "react";
import { api } from "../api";
import { Reminder, Appointment, HealthVital, Medicine } from "../types";
import { CheckCircle2, XCircle, Clock, Calendar, AlertTriangle, ChevronRight, Activity, TrendingUp, Sparkles, User, LogOut } from "lucide-react";

interface DashboardViewProps {
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  selectedPatientId?: string; // Caregiver passive tracking support
}

export default function DashboardView({ onLogout, onNavigate, selectedPatientId }: DashboardViewProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitals, setVitals] = useState<HealthVital[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [skipReminder, setSkipReminder] = useState<Reminder | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const currentUser = api.getCurrentUser();
  const isViewingAsCaregiver = !!selectedPatientId && currentUser?.role === "caregiver";

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate, selectedPatientId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const pid = selectedPatientId || undefined;
      const [remRes, aptRes, vitRes, medRes] = await Promise.all([
        api.getReminders(selectedDate, pid),
        api.getAppointments(pid),
        api.getVitals(pid),
        api.getMedicines(pid)
      ]);
      setReminders(remRes);
      setAppointments(aptRes);
      setVitals(vitRes);
      setMedicines(medRes);
    } catch (e) {
      console.error("Failed to load dashboard statistics:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaken = async (id: string) => {
    setActionLoading(true);
    try {
      await api.updateReminderStatus(id, "taken");
      await fetchDashboardData(); // Refreshes and triggers stock reduction visually
    } catch (e) {
      alert("Error marking medication as taken.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSkipped = async () => {
    if (!skipReminder) return;
    setActionLoading(true);
    try {
      await api.updateReminderStatus(skipReminder.id, "skipped", skipReason);
      setSkipReminder(null);
      setSkipReason("");
      await fetchDashboardData();
    } catch (e) {
      alert("Error marking medication as skipped.");
    } finally {
      setActionLoading(false);
    }
  };

  // Compute adherence rate
  const targetReminders = reminders;
  const takenCount = targetReminders.filter((r) => r.status === "taken").length;
  const skippedCount = targetReminders.filter((r) => r.status === "skipped").length;
  const processedCount = takenCount + skippedCount;
  const totalCount = targetReminders.length;
  const adherencePercent = processedCount > 0 ? Math.round((takenCount / processedCount) * 100) : 100;

  // Inventory Warnings
  const lowStockMeds = medicines.filter((m) => m.stock <= m.minStock);

  // Time navigation generator
  const datesList = [];
  for (let i = -2; i <= 2; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    datesList.push(d.toISOString().split("T")[0]);
  }

  const getDayName = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    if (dateStr === tomorrow) return "Tomorrow";

    const parts = dateStr.split("-");
    const labelDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return labelDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
  };

  return (
    <div id="dashboard-wrapper" className="space-y-6">
      {/* Caregiver Overlay Banner if active */}
      {isViewingAsCaregiver && (
        <div id="caregiver-banner" className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <User size={20} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Caregiver Remote Monitor</p>
              <h4 className="font-bold text-sm text-slate-800">Viewing Patient File: {currentUser?.caregiverId ? "Linked Relatives" : "Assigned Patient Profile"}</h4>
            </div>
          </div>
          <p className="text-xs font-semibold bg-white px-2.5 py-1 rounded-lg border border-blue-100 italic">Read-Only Mode</p>
        </div>
      )}

      {/* Welcome Heading Block */}
      <div id="welcome-heading" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border border-slate-200/85 rounded-2xl">
        <div>
          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 w-fit mb-2">
            <Sparkles size={12} /> Clinical Portal Activated
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Welcome, {currentUser?.fullName || "Patient Member"}
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {isViewingAsCaregiver 
              ? "Overseeing medicine schedules, medication inventory counts, and daily diagnostics."
              : "Here is your prescription treatment schedule and vital logs for today."}
          </p>
        </div>

        <button
          id="logout-btn"
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockMeds.length > 0 && (
        <div id="low-stock-alert-panel" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Low Inventory Medication Warning ({lowStockMeds.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {lowStockMeds.map((m) => (
              <div key={m.id} className="bg-white/80 border border-amber-100 p-2.5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{m.name} <span className="font-normal text-slate-500">({m.dosage})</span></p>
                  <p className="text-slate-500 font-medium mt-0.5">Remaining: <span className="text-red-600 font-bold">{m.stock} units</span></p>
                </div>
                {!isViewingAsCaregiver && (
                  <button
                    onClick={() => onNavigate("medicines")}
                    className="text-amber-700 font-bold hover:underline"
                  >
                    Refill Counter
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Toggle Calendar Ribbon */}
      <div id="calendar-ribbon" className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block flex items-center gap-1.5">
          <Calendar size={14} /> Navigate Schedule Timeline
        </label>
        <div className="grid grid-cols-5 gap-2">
          {datesList.map((d) => {
            const isSelected = selectedDate === d;
            return (
              <button
                key={d}
                id={`calendar-day-${d}`}
                onClick={() => setSelectedDate(d)}
                className={`py-3 px-1.5 text-center rounded-xl flex flex-col justify-center items-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-teal-600 text-white font-bold shadow-md shadow-teal-600/10"
                    : "bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-800 font-medium"
                }`}
              >
                <span className="text-xs capitalize font-semibold">{getDayName(d).split(" ")[0]}</span>
                <span className="text-base font-extrabold mt-0.5">{d.split("-")[2]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Core Grid */}
      <div id="main-dashboard-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Adherence and Reminders Checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Adherence Rate Visualizer */}
          <div id="adherence-gauge" className="bg-white p-6 border border-slate-200/85 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
              {/* SVG circular track */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="#f1f5f9" strokeWidth="9" fill="transparent" />
                <circle cx="56" cy="56" r="46" stroke="#0d9488" strokeWidth="9" fill="transparent"
                  strokeDasharray={289}
                  strokeDashoffset={289 - (289 * adherencePercent) / 100}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-2xl font-black text-slate-800">{adherencePercent}%</span>
            </div>
            
            <div className="space-y-1.5 flex-1 text-center sm:text-left">
              <h3 className="font-bold text-slate-800 text-base">Adherence Treatment Summary</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Compliance rate for {getDayName(selectedDate)} based on taken doses. Maintain <span className="font-bold text-teal-600">80%+</span> compliance weekly for optimum drug safety metrics.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 pt-2 border-t border-slate-50 text-xs">
                <div className="flex items-center gap-1 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-600 inline-block"></span>
                  <span className="font-bold">{takenCount} Taken</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block"></span>
                  <span className="font-bold">{skippedCount} Skipped</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block"></span>
                  <span className="font-bold">{totalCount - processedCount} Remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Area */}
          <div id="reminders-checklist-box" className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div id="checklist-header" className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Clock size={16} className="text-teal-600" /> Reminders Checklist ({getDayName(selectedDate)})
              </h3>
              <p className="text-xs font-semibold text-slate-500">Total doses: {totalCount}</p>
            </div>

            {loading ? (
              <div id="checklist-loading-spinner" className="p-12 text-center">
                <span className="inline-block animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full mb-2"></span>
                <p className="text-xs text-slate-400 font-semibold">Updating medical schedule...</p>
              </div>
            ) : reminders.length === 0 ? (
              <div id="checklist-empty-prompt" className="p-12 text-center bg-slate-50/20">
                <p className="text-slate-400 text-sm font-semibold mb-3">No medication reminders found for this date.</p>
                {!isViewingAsCaregiver && (
                  <button
                    id="add-medicine-shortcut"
                    onClick={() => onNavigate("medicines")}
                    className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Configure Treatment
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reminders.map((rem) => {
                  const time = rem.scheduledTime.split("T")[1];
                  const isTaken = rem.status === "taken";
                  const isSkipped = rem.status === "skipped";
                  
                  return (
                    <div key={rem.id} className="p-4 flex items-center justify-between gap-4 transition-all hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <span className={`p-2.5 rounded-xl ${
                          isTaken 
                            ? "bg-teal-50 text-teal-600" 
                            : isSkipped 
                              ? "bg-red-50 text-red-500" 
                              : "bg-slate-100 text-slate-600"
                        }`}>
                          <Clock size={18} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight">{rem.medicineName}</h4>
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                              {rem.dosage}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                            <Clock size={12} />
                            <span>Schedule: {time}</span>
                            {rem.actualTime && (
                              <span className="text-teal-600 font-bold ml-1.5">
                                • Taken {rem.actualTime.split("T")[1].slice(0, 5)}
                              </span>
                            )}
                            {rem.notes && (
                              <span className="text-red-500 italic ml-1 max-w-[200px] truncate">
                                • Reason: {rem.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {rem.status === "pending" && !isViewingAsCaregiver ? (
                          <>
                            <button
                              id={`take-btn-${rem.id}`}
                              onClick={() => handleMarkTaken(rem.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              <span>Take</span>
                            </button>
                            <button
                              id={`skip-btn-${rem.id}`}
                              onClick={() => setSkipReminder(rem)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <XCircle size={13} />
                              <span>Skip</span>
                            </button>
                          </>
                        ) : (
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border capitalize ${
                            isTaken 
                              ? "bg-teal-50 border-teal-200 text-teal-800" 
                              : isSkipped 
                                ? "bg-red-50 border-red-200 text-red-800" 
                                : "bg-slate-100 border-slate-200 text-slate-700"
                          }`}>
                            {rem.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Diagnostics Vitals & Next Appointment summary */}
        <div className="space-y-6">
          
          {/* Appointment Recap Card */}
          <div id="appointment-summary-card" className="bg-white p-5 border border-slate-200/85 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Calendar size={16} className="text-blue-500" /> Physical Checkups
              </h3>
              <button
                onClick={() => onNavigate("appointments")}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Manage</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {appointments.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold p-4 text-center bg-slate-50/50 rounded-xl">No scheduled checkups found.</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 2).map((apt) => {
                  const date = new Date(apt.dateTime);
                  const isCompleted = apt.status === "completed";
                  return (
                    <div key={apt.id} className="p-3 border border-slate-100 rounded-xl space-y-1 hover:border-slate-200 transition-all bg-slate-50/20">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 text-xs sm:text-sm">{apt.doctorName}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm capitalize ${
                          isCompleted ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-600"
                        }`}>{apt.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{apt.specialty}</p>
                      <p className="text-xs text-blue-800 font-bold mt-1">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vitals Diagnostics Recap Card */}
          <div id="vitals-summary-card" className="bg-white p-5 border border-slate-200/85 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-200 text-sm flex items-center gap-1.5">
                <Activity size={16} className="text-brand-500" /> Diagnostics Vitals
              </h3>
              <button
                onClick={() => onNavigate("vitals")}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Configure</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {vitals.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold p-4 text-center bg-slate-50/50 rounded-xl">No vitals logs recorded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {/* Take latest reading of unique types */}
                {["blood_pressure", "blood_sugar", "heart_rate", "weight"].map((type) => {
                  const matching = vitals.filter((v) => v.type === type);
                  if (matching.length === 0) return null;
                  
                  // sort strictly by newer timestamps
                  const latest = matching.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                  
                  const getUnit = (t: string) => {
                    if (t === "blood_pressure") return "mmHg";
                    if (t === "blood_sugar") return "mg/dL";
                    if (t === "heart_rate") return "bpm";
                    return "kg";
                  };

                  const getLabel = (t: string) => {
                    if (t === "blood_pressure") return "BP";
                    if (t === "blood_sugar") return "Sugar";
                    if (t === "heart_rate") return "Hear Rate";
                    return "Weight";
                  };

                  return (
                    <div key={type} className="p-3 bg-teal-50/30 border border-teal-100/50 rounded-xl flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{getLabel(type)}</p>
                      <h4 className="text-base font-extrabold text-slate-800 tracking-tight my-1">{latest.value}</h4>
                      <p className="text-[9px] font-bold text-teal-700">{getUnit(type)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skip Reminder Dialogue Drawer */}
      {skipReminder && (
        <div id="skip-dialogue-overlay" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-hidden">
          <div id="skip-box" className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Skip Dose: {skipReminder.medicineName}?</h3>
              <p className="text-slate-500 text-xs mt-1 font-medium">Please declare the medical anomaly or rationale for skipping this dose for treatment history compliance logs.</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Reason</label>
              <select
                id="skip-reason-select"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-red-500 outline-none"
              >
                <option value="">-- Choose Rationale --</option>
                <option value="Severe Nausea / Vomiting">Severe Nausea / Vomiting</option>
                <option value="Physician Instructed Skip">Physician Instructed Skip</option>
                <option value="Temporary Shortage">Temporary Shortage</option>
                <option value="Forgot / Belated Timings">Forgot / Belated Timings</option>
                <option value="Felt Symptoms Dissolved">Felt Symptoms Dissolved</option>
              </select>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                id="skip-confirm-btn"
                onClick={handleMarkSkipped}
                disabled={actionLoading || !skipReason}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Confirm Skip
              </button>
              <button
                id="skip-cancel-btn"
                onClick={() => { setSkipReminder(null); setSkipReason(""); }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
