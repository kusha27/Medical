import React, { useState, useEffect } from "react";
import { api } from "../api";
import { HealthVital } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Trash as TrashIcon, PlusSquare, Heart as HeartIcon, Thermometer, User, RefreshCw, AlertCircle } from "lucide-react";

interface VitalsViewProps {
  selectedPatientId?: string; // Caregiver passive tracking
}

export default function VitalsView({ selectedPatientId }: VitalsViewProps) {
  const [vitals, setVitals] = useState<HealthVital[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Input State
  const [type, setType] = useState<"blood_pressure" | "blood_sugar" | "heart_rate" | "weight" | "temperature">("blood_pressure");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [chartType, setChartType] = useState<"blood_pressure" | "blood_sugar" | "heart_rate">("blood_pressure");

  const currentUser = api.getCurrentUser();
  const isViewingAsCaregiver = !!selectedPatientId && currentUser?.role === "caregiver";

  useEffect(() => {
    fetchVitals();
  }, [selectedPatientId]);

  const fetchVitals = async () => {
    setLoading(true);
    try {
      const list = await api.getVitals(selectedPatientId || undefined);
      setVitals(list);
    } catch (e) {
      console.error("Failed to load vitals:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) {
      alert("Please provide the numeric value.");
      return;
    }

    try {
      await api.createVital({ type, value, notes });
      setValue("");
      setNotes("");
      fetchVitals();
    } catch (err: any) {
      alert("Error logging medical vitals.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this specific diagnostic vital log entry?")) return;
    try {
      await api.deleteVital(id);
      fetchVitals();
    } catch (e) {
      alert("Error deleting vital.");
    }
  };

  // Process data for Recharts
  const formatChartData = (vType: string) => {
    const list = vitals
      .filter((v) => v.type === vType)
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return list.map((v) => {
      let numVal = parseFloat(v.value);
      // For blood pressure split systolic
      if (vType === "blood_pressure" && v.value.includes("/")) {
        numVal = parseFloat(v.value.split("/")[0]) || 120;
      }
      return {
        date: new Date(v.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        hour: new Date(v.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        value: numVal,
        raw: v.value
      };
    });
  };

  const bpData = formatChartData("blood_pressure");
  const sugarData = formatChartData("blood_sugar");
  const hrData = formatChartData("heart_rate");

  // Selection toggle config helper
  const getActiveChartData = () => {
    if (chartType === "blood_pressure") return bpData;
    if (chartType === "blood_sugar") return sugarData;
    return hrData;
  };

  const getChartColor = () => {
    if (chartType === "blood_pressure") return "#0d9488"; // teal
    if (chartType === "blood_sugar") return "#3b82f6"; // blue
    return "#ec4899"; // pink/rose hr
  };

  return (
    <div id="vitals-wrapper" className="space-y-6">
      {/* Page Header */}
      <div id="vitals-header" className="flex justify-between items-center bg-white p-6 border border-slate-200/80 rounded-2xl">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Diagnostics Vital Logger</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {isViewingAsCaregiver 
              ? "Overseeing patient health trend charts, blood glucose markers and BP readings." 
              : "Clock regular body diagnostics to monitor medicine treatment biofeedback cycles."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ADD READINGS BLOCK (Take 1-part) */}
        {!isViewingAsCaregiver && (
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <PlusSquare size={16} className="text-teal-600" /> Log Diagnostic Readings
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Type selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Diagnostics Category</label>
                <select
                  id="vital-type-select"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as any);
                    setValue(""); // Clear value for placeholder formatting
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-teal-500 outline-none h-[40px]"
                >
                  <option value="blood_pressure">Blood Pressure (mmHg)</option>
                  <option value="blood_sugar">Blood Sugar (mg/dL)</option>
                  <option value="heart_rate">Heart Rate (bpm)</option>
                  <option value="weight">Body Weight (kg)</option>
                  <option value="temperature">Body Temperature (°C)</option>
                </select>
              </div>

              {/* Value Input */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Measurement Value</label>
                <input
                  id="vital-value-input"
                  type="text"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={
                    type === "blood_pressure" ? "e.g. 120/80" :
                    type === "blood_sugar" ? "e.g. 95 (Fasting)" :
                    type === "heart_rate" ? "e.g. 72" :
                    type === "weight" ? "e.g. 68.4" : "e.g. 36.8"
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-teal-500 outline-none"
                />
              </div>

              {/* Special Notes */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Session Notes</label>
                <textarea
                  id="vital-notes-input"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Taken post morning run, fasting core"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-teal-500 outline-none"
                />
              </div>

              <button
                id="vital-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-xs cursor-pointer shadow-xs"
              >
                Publish Reading
              </button>
            </form>
          </div>
        )}

        {/* CLINICAL TREND CHARTING GRAPH AND LOGS (Take 2-parts) */}
        <div className={`space-y-6 ${isViewingAsCaregiver ? "lg:col-span-3" : "lg:col-span-2"}`}>
          
          {/* Chart Card */}
          <div id="vitals-chart-card" className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <HeartIcon size={18} className="text-rose-500 animate-pulse" />
                <h3 className="font-extrabold text-slate-800 text-sm">Biofeedback Trend Charting</h3>
              </div>

              {/* Toggle specific chart variables */}
              <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-[10px]">
                {[
                  { key: "blood_pressure", label: "Pressure (Sys)" },
                  { key: "blood_sugar", label: "Sugar (Glucose)" },
                  { key: "heart_rate", label: "Heart Rate (Pulse)" }
                ].map((item) => (
                  <button
                    key={item.key}
                    id={`chart-toggle-${item.key}`}
                    onClick={() => setChartType(item.key as any)}
                    className={`px-2 md:px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      chartType === item.key 
                        ? "bg-white text-teal-700 shadow-xs ring-1 ring-slate-200" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-64 w-full">
              {getActiveChartData().length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-8">
                  <p className="text-xs text-slate-400 font-semibold">Insufficient log history to plot values. Log a few readings first!</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getActiveChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getChartColor()} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={getChartColor()} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dat = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg text-[10px] space-y-0.5 border border-slate-800 shadow-xl">
                            <p className="font-bold">{dat.date} • {dat.hour}</p>
                            <p className="text-teal-400 font-black text-xs">Value: {dat.raw}</p>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Area type="monotone" dataKey="value" stroke={getChartColor()} strokeWidth={2.5} fillOpacity={1} fill="url(#chartGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Historical Readings Grid list */}
          <div id="vitals-logs-card" className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Thermometer size={14} className="text-teal-600" /> Historical Diagnostics logs
              </h3>
              <p className="text-xs font-bold text-slate-500">Total metrics: {vitals.length}</p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <span className="inline-block animate-spin h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full mb-1"></span>
                <p className="text-xs text-slate-400 font-semibold">Updating directories...</p>
              </div>
            ) : vitals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-semibold text-xs">
                No visual directories clock recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {vitals
                  .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((v) => {

                    const getBadgeStyle = (t: string) => {
                      if (t === "blood_pressure") return "bg-teal-50 border-teal-200 text-teal-800";
                      if (t === "blood_sugar") return "bg-blue-50 border-blue-150 text-blue-800";
                      if (t === "heart_rate") return "bg-rose-50 border-rose-150 text-rose-800";
                      return "bg-slate-50 border-slate-200 text-slate-700";
                    };

                    const getPrettyLabel = (t: string) => {
                      if (t === "blood_pressure") return "BP";
                      if (t === "blood_sugar") return "Sugar";
                      if (t === "heart_rate") return "Pulse";
                      if (t === "temperature") return "Temp";
                      return t;
                    };

                    return (
                      <div key={v.id} className="p-3.5 flex items-center justify-between gap-4 transition-all hover:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase text-center ${getBadgeStyle(v.type)}`}>
                            {getPrettyLabel(v.type)}
                          </span>
                          <div>
                            <p className="font-extrabold text-slate-800 text-xs sm:text-sm">{v.value}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Logged: {new Date(v.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              {v.notes && <span className="text-slate-500 italic ml-1">• {v.notes}</span>}
                            </p>
                          </div>
                        </div>

                        {!isViewingAsCaregiver && (
                          <button
                            id={`delete-vital-${v.id}`}
                            onClick={() => handleDelete(v.id)}
                            className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
