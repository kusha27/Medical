import { useState, useEffect } from "react";
import { api } from "../api";
import { AdminStats } from "../types";
import { Shield, Users, Activity, Layers, Calendar, CheckSquare, Zap, Terminal, RefreshCw, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    setRefreshing(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (e) {
      console.error("Admin stats fetch failure:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const systemStatusLogs = [
    { source: "REMINDER_DAEMON", type: "INFO", text: "Auto-generated pending checklists successfully for logged patients.", time: "Just Now" },
    { source: "OCR_VISION_ENGINE", type: "INFO", text: "Deciphered clinical prescription slip via Gemini-3.5-Flash.", time: "3 mins ago" },
    { source: "NOTIFIER_SMS_CARRIER", type: "SUCCESS", text: "Delivered SMS dispatch to Patient registered cellular terminal.", time: "18 mins ago" },
    { source: "SECURE_AUTH_JWT_MED", type: "AUTHENTICATE", text: "Issued core security credentials Base64 Token mapping.", time: "42 mins ago" }
  ];

  return (
    <div id="admin-wrapper" className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div id="admin-banner" className="flex justify-between items-center bg-white p-6 border border-slate-200/80 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-xs shrink-0">
            <Shield size={24} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800 flex items-center gap-1.5">
              <span>Admin Supervisor Cabinet</span>
              <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">ROOT ACCESS</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Inspecting app database sizes, compliance metrics, auth logins, and Cron simulated tasks.</p>
          </div>
        </div>

        <button
          onClick={fetchAdminStats}
          disabled={refreshing}
          className="p-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl">
          <span className="inline-block animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mb-2"></span>
          <p className="text-xs text-slate-400 font-semibold">Opening supervisor channels...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          
          {/* Quick Metrics Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            {/* Total Users */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Registered Kernels</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalUsers} Profiles</h3>
              </div>
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={18} />
              </span>
            </div>

            {/* Total Medicines */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Medications Scheduled</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalMeds} Active</h3>
              </div>
              <span className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <Layers size={18} />
              </span>
            </div>

            {/* Total Appointments */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Clinic Appointments</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalAppointments} logged</h3>
              </div>
              <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Calendar size={18} />
              </span>
            </div>

            {/* Global Adherence */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Compliance Constant</p>
                <h3 className="text-2xl font-black text-teal-600 mt-1">{stats.adherenceRate}% taken</h3>
              </div>
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Activity size={18} />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Reminder Compliance Metrics Chart (2-thirds) */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <CheckSquare size={16} className="text-purple-600" /> Active Database Compliance checklist
              </h3>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Taken (Doses)", count: stats.takenCount, color: "#10b981" },
                      { name: "Skipped (Doses)", count: stats.skippedCount, color: "#ef4444" },
                      { name: "Pending (Doses)", count: stats.pendingCount, color: "#6b7280" }
                    ]}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: "bold" }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System logs daemon terminal (1-third) */}
            <div className="bg-slate-900 border border-slate-950 p-5 rounded-2xl shadow-xl text-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="font-extrabold text-slate-200 text-xs flex items-center gap-2">
                    <Terminal size={14} className="text-emerald-500 animate-pulse" />
                    <span>Real-time Cron Daemon Logs</span>
                  </h3>
                  <span className="bg-emerald-950 text-emerald-400 font-mono text-[9px] px-1.5 py-0.5 rounded border border-emerald-850">
                    DAEMON LIVE
                  </span>
                </div>

                <div className="space-y-3 font-mono text-[10px] uppercase text-slate-300">
                  {systemStatusLogs.map((log, idx) => (
                    <div key={idx} className="space-y-0.5 border-b border-slate-800/55 pb-1 select-none">
                      <div className="flex justify-between text-[9px]">
                        <span className={`font-black ${
                          log.type === "SUCCESS" ? "text-emerald-400" :
                          log.type === "AUTHENTICATE" ? "text-purple-400" : "text-blue-400"
                        }`}>
                          [{log.source}]
                        </span>
                        <span className="text-slate-500">{log.time}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed capitalize">{log.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/80 p-2 border border-slate-850 text-[10px] text-slate-400 font-mono rounded mt-3 text-center">
                Port ingress secure channel: <span className="text-emerald-400 font-bold">EXPRESS_PORT3000</span>
              </div>
            </div>

          </div>

          {/* Recent Logins Account Registry table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2 text-xs">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Users size={14} className="text-purple-600" /> Recent registration accounts audit
              </h3>
              <p className="text-xs font-bold text-slate-500">Inspecting newest users</p>
            </div>

            <div className="overflow-x-auto text-[11px] sm:text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-250 bg-slate-50">
                    <th className="p-3 font-extrabold text-slate-700">Account ID</th>
                    <th className="p-3 font-extrabold text-slate-700">Full Name</th>
                    <th className="p-3 font-extrabold text-slate-700">Role Privilege</th>
                    <th className="p-3 font-extrabold text-slate-700">Email Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {stats.recentLogins?.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/30">
                      <td className="p-3 font-mono text-slate-500">{user.id}</td>
                      <td className="p-3 font-bold text-slate-800">{user.fullName}</td>
                      <td className="p-3 font-medium">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                          user.role === "admin" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                          user.role === "caregiver" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-teal-50 text-teal-700 border border-teal-100"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-600">{user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <p className="p-8 text-center text-xs text-slate-400 font-bold">Critical error: stats kernel did not mount.</p>
      )}
    </div>
  );
}
