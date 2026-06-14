import { useState, useEffect } from "react";
import { api } from "./api";
import { User } from "./types";
import { 
  Activity, 
  Clock, 
  ClipboardList, 
  Calendar, 
  Heart, 
  Users, 
  FileText, 
  Terminal, 
  Settings, 
  ShieldAlert, 
  Menu, 
  X,
  Sparkles,
  LogOut
} from "lucide-react";

// Views
import AuthView from "./components/AuthView";
import DashboardView from "./components/DashboardView";
import MedicineManagementView from "./components/MedicineManagementView";
import AppointmentsView from "./components/AppointmentsView";
import VitalsView from "./components/VitalsView";
import CaregiverView from "./components/CaregiverView";
import ReportsView from "./components/ReportsView";
import SimulationsView from "./components/SimulationsView";
import AdminView from "./components/AdminView";
import SettingsView from "./components/SettingsView";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Caregiver patient monitoring state
  const [cgFocusedPatientId, setCgFocusedPatientId] = useState<string | null>(null);

  useEffect(() => {
    // Restore session on mount
    const current = api.getCurrentUser();
    if (current) {
      setUser(current);
      // Auto-reorient tab to admin if they are admin
      if (current.role === "admin") {
        setActiveTab("admin");
      }
    }
    setIsReady(true);
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    if (authenticatedUser.role === "admin") {
      setActiveTab("admin");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleLogout = () => {
    api.clearSession();
    setUser(null);
    setCgFocusedPatientId(null);
    setActiveTab("dashboard");
  };

  // Safe patient tracking focus coupling for caregivers
  const handleFocusPatient = (pid: string | null) => {
    setCgFocusedPatientId(pid);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="inline-block animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full"></span>
      </div>
    );
  }

  if (!user) {
    return <AuthView onSuccess={handleAuthSuccess} />;
  }

  // Sidebar navigation toggling lists based on authorized credentials
  const navigationItems = [
    { key: "dashboard", label: "Dashboard", icon: Clock, show: user.role !== "admin" },
    { key: "medicines", label: "Medication Course", icon: ClipboardList, show: user.role !== "admin" },
    { key: "appointments", label: "Doctor Appointments", icon: Calendar, show: user.role !== "admin" },
    { key: "vitals", label: "Diagnostics Vitals", icon: Heart, show: user.role !== "admin" },
    { key: "caregiver", label: "Caregiver Linkage", icon: Users, show: user.role !== "admin" },
    { key: "reports", label: "Treatment Reports", icon: FileText, show: user.role !== "admin" },
    { key: "simulations", label: "Simulations logger", icon: Terminal, show: user.role !== "admin" },
    { key: "admin", label: "Supervisor Cabinet", icon: ShieldAlert, show: user.role === "admin" },
    { key: "settings", label: "Portal Settings", icon: Settings, show: true }
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView onLogout={handleLogout} onNavigate={setActiveTab} selectedPatientId={cgFocusedPatientId || undefined} />;
      case "medicines":
        return <MedicineManagementView selectedPatientId={cgFocusedPatientId || undefined} />;
      case "appointments":
        return <AppointmentsView selectedPatientId={cgFocusedPatientId || undefined} />;
      case "vitals":
        return <VitalsView selectedPatientId={cgFocusedPatientId || undefined} />;
      case "caregiver":
        return <CaregiverView onFocusPatient={handleFocusPatient} focusedPatientId={cgFocusedPatientId} />;
      case "reports":
        return <ReportsView />;
      case "simulations":
        return <SimulationsView />;
      case "admin":
        return <AdminView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView onLogout={handleLogout} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div id="application-layout" className="min-h-screen flex flex-col md:flex-row bg-slate-50/50">
      
      {/* Mobile Top Header (hidden on md screens) */}
      <div id="mobile-nav-header" className="md:hidden flex items-center justify-between text-slate-800 bg-white border-b border-slate-200/80 px-6 py-4 shadow-xs z-20 sticky top-0 shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-teal-500 text-white rounded-lg">
            <Activity size={18} />
          </span>
          <span className="font-extrabold text-base tracking-tight">Aegis MedRem</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 hover:bg-slate-50 text-slate-600 rounded-lg transition-all"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Persistent Left Sidebar (with off-canvas toggles on mobile) */}
      <aside
        id="side-navigation-panel"
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-950 text-slate-300 flex flex-col justify-between z-30 transition-all duration-300 shrink-0 select-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/60 hidden md:flex items-center gap-2.5">
            <span className="p-2 bg-teal-500 text-white rounded-xl shadow-md shadow-teal-500/10">
              <Activity size={20} />
            </span>
            <div>
              <h1 className="font-black text-white text-base tracking-tight">Aegis MedRem</h1>
              <span className="text-[10px] text-teal-400 font-bold block leading-none">CLINIC DESKTOP v1.0</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-3.5 space-y-1 text-xs">
            {navigationItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    id={`nav-tab-${item.key}`}
                    onClick={() => {
                      setActiveTab(item.key);
                      setSidebarOpen(false);
                    }}
                    className={`w-full py-3 px-4 font-bold rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                      isActive
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-600/10"
                        : "hover:bg-slate-800/50 hover:text-white text-slate-400 font-semibold"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Profile Card Footer */}
        <div className="p-4 border-t border-slate-800/60 flex items-center justify-between gap-2 bg-slate-950/20">
          <div className="truncate pr-1">
            <h4 id="user-display-name" className="text-white text-xs font-bold leading-tight truncate">{user.fullName}</h4>
            <span id="user-display-email" className="text-[10px] font-semibold text-slate-500 truncate block mt-0.5 capitalize">{user.role} Member</span>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Backdrop shade overlay for mobile menus */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 z-20 md:hidden transition-all duration-200"
        ></div>
      )}

      {/* Main Core Document Frame */}
      <main id="core-viewport-frame" className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full overflow-x-hidden min-h-screen">
        <div id="content-container" className="flex-1 animate-fade-in">
          {renderActiveView()}
        </div>
      </main>

    </div>
  );
}
