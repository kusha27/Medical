import React, { useState } from "react";
import { api } from "../api";
import { User, Shield, Bell, Key, Sparkles, UserCheck } from "lucide-react";

export default function SettingsView() {
  const currentUser = api.getCurrentUser();
  const [profileName, setProfileName] = useState(currentUser?.fullName || "");
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || "");
  
  // Notification States
  const [simSms, setSimSms] = useState(true);
  const [simEmail, setSimEmail] = useState(true);
  const [simPush, setSimPush] = useState(true);
  
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      alert("Please provide flat name and email inputs");
      return;
    }
    setSaveLoading(true);
    try {
      await api.updateProfile(profileName, profileEmail, new Date().getTimezoneOffset());
      alert("Personal profile preferences saved successfully across clinical systems.");
    } catch (err: any) {
      alert("Failed to update profile values on the server: " + (err.message || err));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div id="settings-wrapper" className="space-y-6">
      {/* Header */}
      <div id="settings-banner" className="bg-white p-6 border border-slate-200/80 rounded-2xl">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Personal & Profile Settings</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Configure clinical accounts, sync carrier channels, and tweak portal preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card Form */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <UserCheck size={16} className="text-teal-650" /> Update Clinical Profile
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Account Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-teal-500 outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Email address</label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-teal-500 outline-none"
              />
            </div>

            {/* Account Role */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block mr-2">Core Account role privilege</label>
              <input
                type="text"
                disabled
                value={currentUser?.role.toUpperCase() || "PATIENT"}
                className="w-full border border-slate-150 bg-slate-50 text-slate-500 font-bold rounded-xl px-3 py-2 text-xs outline-none uppercase"
              />
            </div>

            <button
              id="settings-save-profile"
              type="submit"
              disabled={saveLoading}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs disabled:opacity-45"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Channels Configuration Card */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-5">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <Bell size={16} className="text-teal-600" /> Carrier Dispatches Activation
          </h3>

          <div className="space-y-4 text-xs font-semibold">
            <p className="text-slate-500 font-medium leading-relaxed">Toggle the simulated cellular or emergency messaging lines below. Reminders triggered throughout checklists will automatically map delivery across these active lines.</p>
            
            <div className="space-y-3 pt-1">
              {/* Push dispathes */}
              <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="font-extrabold text-slate-800">Push App Alerts (In-App notifications)</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Launches prompt overlays instantly within browser frames.</p>
                </div>
                <input
                  type="checkbox"
                  checked={simPush}
                  onChange={(e) => setSimPush(e.target.checked)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                />
              </label>

              {/* Email dispatches */}
              <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="font-extrabold text-slate-800">Physician Email Dispatches</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mails summary treatment outlines upon checklist completions.</p>
                </div>
                <input
                  type="checkbox"
                  checked={simEmail}
                  onChange={(e) => setSimEmail(e.target.checked)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                />
              </label>

              {/* SMS Cellular alerts */}
              <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="font-extrabold text-slate-800">Simulate SMS cellular notification alerts</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sends automated cellular alert warning pings immediately.</p>
                </div>
                <input
                  type="checkbox"
                  checked={simSms}
                  onChange={(e) => setSimSms(e.target.checked)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* SMTP Activation Panel */}
            <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-[11px] leading-relaxed">
              <h4 className="font-extrabold text-teal-800 flex items-center gap-1">
                <Sparkles size={13} className="text-teal-600" /> Real-Time Email Setup Instructions
              </h4>
              <p className="text-slate-500 font-medium">
                To route actual dose alarms and consultation briefs straight to your mailbox (e.g., <strong className="text-slate-700">{profileEmail || "your email"}</strong>), please configure your SMTP details inside the <strong>Secrets Settings panel</strong> in AI Studio:
              </p>
              <div className="font-mono text-[9px] bg-white border border-slate-200 p-2.5 rounded-lg space-y-1 text-slate-600 select-all leading-tight">
                <p>SMTP_HOST=smtp.gmail.com</p>
                <p>SMTP_PORT=465</p>
                <p>SMTP_USER=ushak20051@gmail.com</p>
                <p>SMTP_PASS=your_gmail_app_password</p>
                <p>SMTP_FROM="Aegis MedRem" &lt;ushak20051@gmail.com&gt;</p>
              </div>
              <p className="text-[10px] text-teal-700 font-bold">
                * Note: Aegis MedRem background cron daemon runs every 60s, automatically converting due pending reminders into clinical emails.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
