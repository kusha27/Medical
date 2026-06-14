import React, { useState, useEffect } from "react";
import { api } from "../api";
import { SystemNotification } from "../types";
import { Send, Bell, Mail, MessageSquare, Terminal, RefreshCw, Smartphone, Layers, CheckSquare } from "lucide-react";

export default function SimulationsView() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState<"push" | "email" | "sms">("push");
  
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SIMULATOR BOOT] Notification center online. Listening for intake reminder events..."
  ]);
  const [sendLoading, setSendLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (e) {
      console.error("Failed to load notifications list:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      alert("Please enter title and description.");
      return;
    }

    setSendLoading(true);
    try {
      const res = await api.triggerInstantNotification(title, message, method);
      if (res.success && res.log) {
        setTerminalLogs((prev) => [res.log, ...prev]);
        setTitle("");
        setMessage("");
        await fetchNotifications();
      }
    } catch (err: any) {
      alert("Error sending simulation.");
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div id="simulations-wrapper" className="space-y-6">
      {/* Header Banner */}
      <div id="simulations-header" className="bg-white p-6 border border-slate-200/80 rounded-2xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            <Bell size={22} className="text-teal-650" /> Push, Email, & SMS simulations
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Review triggered transmission logs, simulate emergency alert dispatches, and audit carrier routing paths.</p>
        </div>

        <button
          onClick={fetchNotifications}
          disabled={loading}
          className="p-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-all disabled:opacity-45"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        
        {/* DISPATCH CENTER FORM CARD (1-part) */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <Send size={15} className="text-teal-600" /> Dispatch Testing Center
          </h3>

          <form onSubmit={handleSimulate} className="space-y-4 text-xs font-semibold">
            {/* Method selection */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Delivering Channel Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "push", label: "Push App", icon: Bell },
                  { key: "email", label: "Email Box", icon: Mail },
                  { key: "sms", label: "Cellular SMS", icon: MessageSquare }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = method === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setMethod(item.key as any)}
                      className={`py-2 px-1 text-[10px] font-bold border rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                        isSelected 
                          ? "bg-teal-50 border-teal-500 text-teal-800 font-black" 
                          : "border-slate-150 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Title */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Alert Headline Title</label>
              <input
                id="sim-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Critical Dose Reminder"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-teal-500 outline-none"
              />
            </div>

            {/* Content Message */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Notification Narrative Description</label>
              <textarea
                id="sim-message"
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Please take Amoxicillin capsule immediately. Stock count dropping."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-teal-500 outline-none"
              />
            </div>

            <button
              id="sim-submit-btn"
              type="submit"
              disabled={sendLoading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1"
            >
              <Send size={12} />
              <span>Broadcast simulated Alert</span>
            </button>
          </form>
        </div>

        {/* RECENT DISPATCHES DIRECTORY & SIMULATOR CLI (2-parts) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SIMULATED CLI STATUS FEED */}
          <div className="bg-slate-900 border border-slate-950 p-5 rounded-2xl shadow-xl space-y-3 font-mono text-[10px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-slate-200 text-xs flex items-center gap-2">
                <Terminal size={14} className="text-teal-400" />
                <span>Simulated Carrier Transmission Console</span>
              </h3>
              <span className="bg-slate-950 text-slate-500 text-[8px] font-mono border border-slate-850 px-1.5 rounded">
                SIMULATOR LIVE
              </span>
            </div>

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto text-slate-350 style-scroll select-none">
              {terminalLogs.map((log, idx) => (
                <p key={idx} className="leading-relaxed hover:text-white">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
                </p>
              ))}
            </div>
          </div>

          {/* Historical reminder triggers lists */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2 text-xs font-bold">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <CheckSquare size={14} className="text-teal-600" /> Delivery audit logs history
              </h3>
              <p className="text-slate-500 font-semibold">Total alerts synced: {notifications.length}</p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-400 font-semibold text-xs">
                Syncing audit records...
              </div>
            ) : notifications.length === 0 ? (
              <p className="p-12 text-center text-xs text-slate-400 font-bold bg-slate-50/20">No triggered alert broadcasts logged in database.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.type === "email" ? Mail : n.type === "sms" ? MessageSquare : Bell;
                  return (
                    <div key={n.id} className="p-4 flex items-start gap-3.5 transition-all hover:bg-slate-50/50">
                      <span className={`p-2 rounded-xl shrink-0 ${
                        n.type === "email" ? "bg-orange-50 text-orange-600" :
                        n.type === "sms" ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"
                      }`}>
                        <Icon size={16} />
                      </span>

                      <div className="space-y-0.5 flex-1 select-none">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">{n.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(n.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-slate-500 leading-relaxed font-semibold text-[11px] sm:text-xs">{n.message}</p>
                        
                        <div className="flex gap-2 items-center text-[10px] text-slate-400 font-medium pt-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ">{n.type} channel</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <Smartphone size={10} /> Carrier Delivered (Status 200)
                          </span>
                        </div>
                      </div>
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
