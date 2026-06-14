import React, { useState } from "react";
import { api } from "../api";
import { User } from "../types";
import { ShieldAlert, Activity, Key, Mail, User as UserIcon, LogIn, ClipboardList, CheckCircle2 } from "lucide-react";

interface AuthViewProps {
  onSuccess: (user: User) => void;
}

export default function AuthView({ onSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"user" | "caregiver" | "admin">("user");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fast demo credentials
  const demoAccounts = {
    user: { u: "demo", p: "demo123" },
    caregiver: { u: "caregiver", p: "demo123" },
    admin: { u: "admin", p: "admin123" }
  };

  const handleDemoSignIn = async (type: "user" | "caregiver" | "admin") => {
    setError(null);
    setLoading(true);
    const credentials = demoAccounts[type];
    try {
      const data = await api.login(credentials.u, credentials.p);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err?.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username || !password || (!isLogin && (!email || !fullName))) {
      setError("Please fill in all requested fields");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const data = await api.login(username, password);
        onSuccess(data.user);
      } else {
        const data = await api.register({
          username,
          fullName,
          email,
          password,
          role
        });
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication attempt was unsuccessful");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen-container" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      {/* Brand Header */}
      <div id="auth-brand" className="text-center mb-8">
        <div className="inline-flex p-3 bg-teal-100 text-teal-600 rounded-2xl mb-3 shadow-[0_4px_12px_rgba(13,148,136,0.15)] animate-pulse">
          <Activity size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Aegis MedRem</h1>
        <p className="text-slate-600 font-medium max-w-sm mt-1 text-sm">
          Comprehensive full-stack medication schedules, prescription OCR scanning & care linkages
        </p>
      </div>

      <div id="auth-card" className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-8">
        <div id="auth-tabs" className="flex border-b border-slate-100 mb-6 font-medium text-sm">
          <button
            id="tab-login"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 pb-3 text-center transition-all ${isLogin ? "text-teal-600 border-b-2 border-teal-600 font-semibold" : "text-slate-400 hover:text-slate-600"}`}
          >
            Sign In
          </button>
          <button
            id="tab-register"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 pb-3 text-center transition-all ${!isLogin ? "text-teal-600 border-b-2 border-teal-600 font-semibold" : "text-slate-400 hover:text-slate-600"}`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div id="auth-error-banner" className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5">
            <ShieldAlert size={16} className="shrink-0" />
            <p className="font-mediumLeading text-slate-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Role Picker */}
              <div id="register-role-section">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Select Your Clinical Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["user", "caregiver", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      id={`role-btn-${r}`}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-1 text-xs font-semibold border rounded-xl capitalize transition-all ${
                        role === r
                          ? "bg-teal-50 border-teal-500 text-teal-700 font-bold"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {r === "user" ? "Patient" : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div id="auth-field-fullname">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <UserIcon size={16} />
                  </span>
                  <input
                    id="input-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g., Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-sm"
                  />
                </div>
              </div>

              {/* Email address */}
              <div id="auth-field-email">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    id="input-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jane@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Username */}
          <div id="auth-field-username">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <UserIcon size={16} />
              </span>
              <input
                id="input-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="User identifier"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div id="auth-field-password">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Key size={16} />
              </span>
              <input
                id="input-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-sm"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-xl shadow-xs hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : (
              <>
                <LogIn size={16} />
                {isLogin ? "Sign In to Clinic" : "Create Account"}
              </>
            )}
          </button>
        </form>

        {/* 1-Click Clinic Portals Demo Login */}
        <div id="demo-portals-section" className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-xs font-bold text-slate-500 text-center uppercase tracking-wider mb-3">
            Simulated Portals Demo (1-Click login)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="demo-login-patient"
              type="button"
              onClick={() => handleDemoSignIn("user")}
              className="py-2 px-1 text-center border border-dashed border-teal-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-xl transition-all cursor-pointer group"
            >
              <div className="text-teal-600 group-hover:scale-105 transition-all text-xs font-bold flex flex-col items-center">
                <ClipboardList size={16} className="mb-1" />
                <span>Patient</span>
              </div>
            </button>

            <button
              id="demo-login-caregiver"
              type="button"
              onClick={() => handleDemoSignIn("caregiver")}
              className="py-2 px-1 text-center border border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer group"
            >
              <div className="text-blue-600 group-hover:scale-105 transition-all text-xs font-bold flex flex-col items-center">
                <UserIcon size={16} className="mb-1" />
                <span>Caregiver</span>
              </div>
            </button>

            <button
              id="demo-login-admin"
              type="button"
              onClick={() => handleDemoSignIn("admin")}
              className="py-2 px-1 text-center border border-dashed border-purple-200 hover:border-purple-500 hover:bg-purple-50/50 rounded-xl transition-all cursor-pointer group"
            >
              <div className="text-purple-600 group-hover:scale-105 transition-all text-xs font-bold flex flex-col items-center">
                <CheckCircle2 size={16} className="mb-1" />
                <span>Admin</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
