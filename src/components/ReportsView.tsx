import { useState, useEffect } from "react";
import { api } from "../api";
import { Reminder, Medicine } from "../types";
import { BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, Printer, Award, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

export default function ReportsView() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
      
      // Pull reminders from these dates to form historical aggregate
      const [rToday, rYes, rDb, medList] = await Promise.all([
        api.getReminders(today),
        api.getReminders(yesterday),
        api.getReminders(dayBefore),
        api.getMedicines()
      ]);

      setReminders([...rToday, ...rYes, ...rDb]);
      setMedicines(medList);
    } catch (e) {
      console.error("Failed to load historical compliance lists:", e);
    } finally {
      setLoading(false);
    }
  };

  // Compile compliance percentages
  const totalCount = reminders.length;
  const takenCount = reminders.filter((r) => r.status === "taken").length;
  const skippedCount = reminders.filter((r) => r.status === "skipped").length;
  const pendingCount = reminders.filter((r) => r.status === "pending").length;
  const activeProcessed = takenCount + skippedCount;

  const complianceRate = activeProcessed > 0 ? Math.round((takenCount / activeProcessed) * 100) : 100;

  // Pie chart skip rationale compiles
  const skipReasons: Record<string, number> = {};
  reminders
    .filter((r) => r.status === "skipped" && r.notes)
    .forEach((r) => {
      const reason = r.notes || "Not Declared";
      skipReasons[reason] = (skipReasons[reason] || 0) + 1;
    });

  const pieData = Object.keys(skipReasons).map((k) => ({
    name: k,
    value: skipReasons[k]
  }));

  const COLORS = ["#0d9488", "#f43f5e", "#eab308", "#3b82f6", "#a855f7"];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="reports-wrapper" className="space-y-6">
      {/* Page Header */}
      <div id="reports-header" className="flex justify-between items-center bg-white p-6 border border-slate-200/80 rounded-2xl print:hidden">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Compliance & Adherence Reports</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Aggregated statistics of your medication adherence compiled over the last 72 hours.</p>
        </div>

        <button
          id="print-report-btn"
          onClick={handlePrint}
          className="flex items-center gap-1 px-4 py-2 bg-slate-850 hover:bg-slate-900 border border-slate-200 text-slate-800 hover:text-slate-950 font-bold text-xs sm:text-xs rounded-xl cursor-pointer transition-all shadow-xs"
        >
          <Printer size={15} />
          <span>Print/PDF Report</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl">
          <span className="inline-block animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full mb-2"></span>
          <p className="text-xs text-slate-400 font-semibold">Compiling medical statistics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Print Only Header */}
          <div className="hidden print:block text-slate-950 border-b border-slate-400 pb-5 space-y-2">
            <h1 className="text-2xl font-black">AEGIS CLINICAL PORTAL COMPLIANCE PROTOCOL</h1>
            <p className="text-xs font-semibold">Subject Fullname: {api.getCurrentUser()?.fullName} | Username Reference: {api.getCurrentUser()?.username}</p>
            <p className="text-xs">Date Compiled: {new Date().toLocaleString()}</p>
          </div>

          {/* Adherence Overview Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Adherence Compliance</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className={`text-4xl font-black ${complianceRate >= 80 ? 'text-teal-600' : 'text-amber-600'}`}>{complianceRate}%</h3>
                <p className="text-xs text-slate-400 font-bold">taken of processed Doses</p>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-3 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                <Award size={13} className="text-teal-600 shrink-0" />
                <span>{complianceRate >= 80 ? "Perfect treatment compliance!" : "Improve adherence to secure optimal recovery."}</span>
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clocked Intakes</span>
              <div className="flex items-baseline gap-1 mt-2">
                <h3 className="text-4xl font-black text-slate-800">{takenCount} / {activeProcessed}</h3>
                <p className="text-xs text-slate-400 font-bold">Intakes completed</p>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-3 bg-teal-50 p-2 rounded-lg text-teal-850">
                You have skipped {skippedCount} registered doses.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Refills Coverage</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <h3 className="text-4xl font-black text-rose-600">
                  {medicines.filter((m) => m.stock <= m.minStock).length}
                </h3>
                <p className="text-xs text-slate-400 font-bold">Medicines low stock</p>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-3 bg-red-50 p-2 rounded-lg text-red-800">
                Total unique medicines programs listed: {medicines.length}
              </p>
            </div>
          </div>

          {/* Adherence Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
            {/* Pie Chart of Skip rationale */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <AlertCircle size={16} className="text-rose-500" /> Rationale For Skipped Medications
              </h3>

              <div className="h-64 w-full flex items-center justify-center">
                {pieData.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold p-8 text-center bg-slate-50/50 rounded-xl w-full">Excellent! No skipped doses logged over the compile window.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "9px", fontWeight: "bold" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Treatment Adherence Rate BarChart */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <TrendingUp size={16} className="text-teal-600" /> Intake Adherence Rates
              </h3>

              <div className="h-64 w-full flex items-center justify-center">
                {totalCount === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold p-8 text-center bg-slate-50/20 rounded-xl w-full">No medication checklists processed recently.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Taken (Doses)", count: takenCount, fill: "#0d9488" },
                        { name: "Skipped (Doses)", count: skippedCount, fill: "#f43f5e" },
                        { name: "Pending (Doses)", count: pendingCount, fill: "#cbd5e1" }
                      ]}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: "bold" }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {[
                          <Cell key="cell-0" fill="#0d9488" />,
                          <Cell key="cell-1" fill="#f43f5e" />,
                          <Cell key="cell-2" fill="#cbd5e1" />
                        ]}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* printable medicine list schematics summary */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 print:text-base border-b border-slate-100 pb-2">
              <FileText size={16} className="text-teal-650" /> Active Prescribed Medicines Table
            </h3>

            {medicines.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold text-center p-8 bg-slate-50 rounded-xl">No active treatment medications registry recorded.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 print:bg-slate-100">
                      <th className="p-3 font-extrabold text-slate-700">Trademark Medic</th>
                      <th className="p-3 font-extrabold text-slate-700">Strength</th>
                      <th className="p-3 font-extrabold text-slate-700">Category</th>
                      <th className="p-3 font-extrabold text-slate-700">Frequency</th>
                      <th className="p-3 font-extrabold text-slate-700 text-right">In-Stock Doses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {medicines.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-850">{m.name}</td>
                        <td className="p-3 font-medium text-slate-600">{m.dosage}</td>
                        <td className="p-3 font-medium text-slate-600">{m.category}</td>
                        <td className="p-3 font-bold text-teal-800 capitalize">{m.frequency}</td>
                        <td className={`p-3 font-bold text-right ${m.stock <= m.minStock ? 'text-red-650' : 'text-slate-800'}`}>
                          {m.stock} Doses remaining
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
