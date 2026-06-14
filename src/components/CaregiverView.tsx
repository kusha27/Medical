import React, { useState, useEffect } from "react";
import { api } from "../api";
import { User, Medicine, Reminder, HealthVital } from "../types";
import { UserCheck, UserX, Link, Search, CheckCircle2, AlertCircle, Eye, Clipboard, Clock, ChevronRight } from "lucide-react";
import DashboardView from "./DashboardView";

interface CaregiverViewProps {
  onFocusPatient: (patientId: string | null) => void;
  focusedPatientId: string | null;
}

export default function CaregiverView({ onFocusPatient, focusedPatientId }: CaregiverViewProps) {
  const [caregiverUsername, setCaregiverUsername] = useState("");
  const [patients, setPatients] = useState<User[]>([]);
  const [linkedCaregiver, setLinkedCaregiver] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = api.getCurrentUser();
  const isCaregiver = currentUser?.role === "caregiver";

  useEffect(() => {
    initView();
  }, []);

  const initView = async () => {
    setLoading(true);
    try {
      if (isCaregiver) {
        const list = await api.getPatients();
        setPatients(list);
      } else {
        await api.refreshProfile(); // Refresh current user to check linked caregiver
        const user = api.getCurrentUser();
        if (user?.caregiverId) {
          setLinkedCaregiver(user.caregiverId); // Simply map presence
        }
      }
    } catch (e) {
      console.error("Failed to sync caregiver modules:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caregiverUsername) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await api.linkCaregiver(caregiverUsername);
      if (res.success) {
        alert(`Successfully linked associated caregiver: ${res.caregiverName}`);
        setCaregiverUsername("");
        initView();
      }
    } catch (err: any) {
      setError(err?.message || "Linking failed. Please check the certified username.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to stop sending clinical updates to your Caregiver?")) return;
    setActionLoading(true);
    try {
      await api.unlinkCaregiver();
      setLinkedCaregiver(null);
      alert("Successfully unlinked.");
      initView();
    } catch (e) {
      alert("Error unlinking.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div id="caregiver-wrapper" className="space-y-6">
      <div id="caregiver-header" className="bg-white p-6 border border-slate-200/80 rounded-2xl">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Caregiver Alignment Center</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          {isCaregiver 
            ? "Inspect patient list entries, monitor adherence compliance rates, and configure checklists." 
            : "Authorize clinical observers, link relative guardians, and sync treatment feedback programs."}
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl">
          <span className="inline-block animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full mb-2"></span>
          <p className="text-xs text-slate-400 font-semibold">Aligning caregiver networks...</p>
        </div>
      ) : isCaregiver ? (
        /* CAREGIVER INTERACTIVE INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Selection sidebar (1-part) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs h-fit space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Clipboard size={16} className="text-teal-600" /> Inspected Patients ({patients.length})
            </h3>

            {patients.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                No patient users have linked to your observer username yet. Provide patient profiles with your username: <span className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-700 font-mono font-bold hover:bg-slate-200 select-all">{currentUser?.username}</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {patients.map((p) => {
                  const isActive = focusedPatientId === p.id;
                  return (
                    <button
                      key={p.id}
                      id={`patient-observer-btn-${p.id}`}
                      onClick={() => onFocusPatient(isActive ? null : p.id)}
                      className={`w-full p-4 text-left border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isActive 
                          ? "bg-teal-50 border-teal-500 shadow-md shadow-teal-500/5 text-teal-900 font-extrabold" 
                          : "border-slate-150 hover:border-slate-350 hover:bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm">{p.fullName}</h4>
                        <p className={`text-[10px] mt-0.5 font-medium ${isActive ? "text-teal-700" : "text-slate-400"}`}>
                          Username: {p.username}
                        </p>
                      </div>
                      <ChevronRight size={16} className={isActive ? "text-teal-600 translate-x-1 transition-all" : "text-slate-300"} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACTIVE OBSERVER VIEWPORT (2-parts) */}
          <div className="lg:col-span-2 space-y-4">
            {focusedPatientId ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-teal-50 border border-teal-200 p-4 rounded-xl text-teal-950">
                  <div className="flex items-center gap-2">
                    <UserCheck size={18} className="text-teal-600 animate-pulse" />
                    <p className="text-xs font-black">ACTIVE MONITOR: {patients.find((p) => p.id === focusedPatientId)?.fullName || "Focus Subject"}</p>
                  </div>
                  <button
                    onClick={() => onFocusPatient(null)}
                    className="text-xs font-bold text-teal-700 hover:underline border border-teal-200 bg-white px-2 py-0.5 rounded-md cursor-pointer"
                  >
                    Disconnect Observance
                  </button>
                </div>

                {/* Frame the DashboardView targeted specifically at this Patient */}
                <DashboardView 
                  selectedPatientId={focusedPatientId} 
                  onLogout={() => {}} 
                  onNavigate={() => {}} 
                />
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 p-12 text-center rounded-2xl flex flex-col items-center justify-center">
                <Eye size={36} className="text-slate-300 mb-3" />
                <h3 className="font-extrabold text-slate-800 text-base">Passive Monitor Viewport</h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm mt-1">Select a patient card from the inspections panel on the left to review their live treatment adherence rate, checklist and diagnostics in real-time.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PATIENT AUTHORIZATION CONTROLS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Linkage Card */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-5">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Link size={16} className="text-teal-600" /> Bind Observer Guardian
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {currentUser?.caregiverId ? (
              <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2.5 text-teal-900 font-bold text-xs sm:text-sm">
                  <UserCheck size={20} className="text-teal-600" />
                  <span>Observer Guardian Active coupling</span>
                </div>
                <p className="text-xs text-teal-700 leading-normal font-medium">Your daily medication schedule checklists, inventory warns and diagnostic vitals reports are synchronized live for real-time surveillance.</p>
                
                <button
                  onClick={handleUnlink}
                  disabled={actionLoading}
                  className="py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Disconnect observership
                </button>
              </div>
            ) : (
              <form onSubmit={handleLink} className="space-y-4 text-xs font-semibold">
                <p className="text-slate-500 font-medium leading-relaxed">Type your Caregiver Observer's registered username below. If you don't have one, ask your doctor or relative helper to sign up as a Caregiver, and provide their username.</p>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Caregiver Observers Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Search size={14} />
                    </span>
                    <input
                      id="cg-link-username"
                      type="text"
                      required
                      value={caregiverUsername}
                      onChange={(e) => setCaregiverUsername(e.target.value)}
                      placeholder="e.g., caregiver"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <button
                  id="cg-link-submit"
                  type="submit"
                  className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Request Linkage
                </button>
              </form>
            )}
          </div>

          {/* Observer explanation details card */}
          <div className="bg-slate-50 border border-slate-200/40 p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">How Caregiver Observer works</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">By binding a caregiver, you give your designated observer (e.g., adult child, home care nurse, personal doctor) direct remote supervision of your treatment health state without requiring you to manually check in with them daily.</p>
              
              <div className="space-y-2 pt-2 text-xs text-slate-600">
                <p className="flex items-start gap-1.5 font-bold">• <span className="font-normal text-slate-500">Caregivers can view drug inventories to coordinate refills timely.</span></p>
                <p className="flex items-start gap-1.5 font-bold">• <span className="font-normal text-slate-500">Caregivers get instant visibility if checklists are missed or skipped.</span></p>
                <p className="flex items-start gap-1.5 font-bold">• <span className="font-normal text-slate-500">Vitals blood sugar readings or cardiac blood pressure trend lines sync in real-time.</span></p>
              </div>
            </div>

            <div className="bg-white p-3.5 border border-slate-150 rounded-xl text-xs mt-4">
              <span className="font-bold text-teal-700 block">Preset Demo Observation:</span>
              <p className="text-slate-500 mt-0.5 leading-normal font-medium">To test this instantly, link with the registered demo observer username: <span className="bg-slate-100 font-mono text-teal-800 font-bold px-1 py-0.5 rounded border border-slate-100 select-all">caregiver</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
