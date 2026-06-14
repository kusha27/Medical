import { User, Medicine, Reminder, Appointment, HealthVital, SystemNotification, AdminStats } from "./types";

let token: string | null = localStorage.getItem("med_rem_token");
let currentUser: User | null = null;

try {
  const savedUser = localStorage.getItem("med_rem_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }
} catch (e) {
  console.error("Failed to restore session:", e);
}

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  getCurrentUser() {
    return currentUser;
  },

  getToken() {
    return token;
  },

  setSession(newToken: string, user: User) {
    token = newToken;
    currentUser = user;
    localStorage.setItem("med_rem_token", newToken);
    localStorage.setItem("med_rem_user", JSON.stringify(user));
  },

  clearSession() {
    token = null;
    currentUser = null;
    localStorage.removeItem("med_rem_token");
    localStorage.removeItem("med_rem_user");
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
    const mergedOptions = {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {})
      }
    };

    const res = await fetch(url, mergedOptions);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed with code ${res.status}`);
    }
    return res.json();
  },

  // Auth Operations
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    this.setSession(data.token, data.user);
    return data;
  },

  async register(payload: any): Promise<{ token: string; user: User }> {
    const data = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    this.setSession(data.token, data.user);
    return data;
  },

  async refreshProfile(): Promise<User> {
    const data = await this.request("/auth/me");
    if (currentUser) {
      currentUser = { ...currentUser, ...data };
      localStorage.setItem("med_rem_user", JSON.stringify(currentUser));
    }
    return data;
  },

  // Medications CRUD
  async getMedicines(patientId?: string): Promise<Medicine[]> {
    const query = patientId ? `?patientId=${patientId}` : "";
    return this.request(`/medicines${query}`);
  },

  async createMedicine(medicine: Partial<Medicine>): Promise<Medicine> {
    return this.request("/medicines", {
      method: "POST",
      body: JSON.stringify(medicine)
    });
  },

  async updateMedicine(id: string, medicine: Partial<Medicine>): Promise<Medicine> {
    return this.request(`/medicines/${id}`, {
      method: "PUT",
      body: JSON.stringify(medicine)
    });
  },

  async deleteMedicine(id: string): Promise<{ success: boolean }> {
    return this.request(`/medicines/${id}`, {
      method: "DELETE"
    });
  },

  // Reminders Intake
  async getReminders(dateStr: string, patientId?: string): Promise<Reminder[]> {
    let url = `/reminders?date=${dateStr}`;
    if (patientId) url += `&patientId=${patientId}`;
    return this.request(url);
  },

  async generateReminders(dateStr: string): Promise<any> {
    return this.request("/reminders/generate", {
      method: "POST",
      body: JSON.stringify({ date: dateStr })
    });
  },

  async updateReminderStatus(id: string, status: "taken" | "skipped", notes?: string): Promise<Reminder> {
    return this.request(`/reminders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, notes })
    });
  },

  // Appointments CRUD
  async getAppointments(patientId?: string): Promise<Appointment[]> {
    const query = patientId ? `?patientId=${patientId}` : "";
    return this.request(`/appointments${query}`);
  },

  async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    return this.request("/appointments", {
      method: "POST",
      body: JSON.stringify(appointment)
    });
  },

  async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    return this.request(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(appointment)
    });
  },

  async deleteAppointment(id: string): Promise<{ success: boolean }> {
    return this.request(`/appointments/${id}`, {
      method: "DELETE"
    });
  },

  // Vitals tracking
  async getVitals(patientId?: string): Promise<HealthVital[]> {
    const query = patientId ? `?patientId=${patientId}` : "";
    return this.request(`/vitals${query}`);
  },

  async createVital(vital: Partial<HealthVital>): Promise<HealthVital> {
    return this.request("/vitals", {
      method: "POST",
      body: JSON.stringify(vital)
    });
  },

  async deleteVital(id: string): Promise<{ success: boolean }> {
    return this.request(`/vitals/${id}`, {
      method: "DELETE"
    });
  },

  // Caregiver linkages
  async getPatients(): Promise<User[]> {
    return this.request("/caregiver/patients");
  },

  async linkCaregiver(caregiverUsername: string): Promise<{ success: boolean; caregiverName: string }> {
    return this.request("/caregiver/link", {
      method: "POST",
      body: JSON.stringify({ caregiverUsername })
    });
  },

  async unlinkCaregiver(): Promise<{ success: boolean }> {
    return this.request("/caregiver/unlink", {
      method: "POST"
    });
  },

  // Simulations lookup
  async getNotifications(): Promise<SystemNotification[]> {
    return this.request("/notifications");
  },

  async triggerInstantNotification(title: string, message: string, method: string): Promise<any> {
    return this.request("/notifications/simulate-instant", {
      method: "POST",
      body: JSON.stringify({ title, message, method })
    });
  },

  // Prescription AI Vision Scanner
  async runOCR(base64Image: string, mimeType: string): Promise<{ doctorName?: string; date?: string; medications: any[] }> {
    return this.request("/prescriptions/upload-ocr", {
      method: "POST",
      body: JSON.stringify({ base64Image, mimeType })
    });
  },

  // Admin Lookup
  async getAdminStats(): Promise<AdminStats> {
    return this.request("/admin/stats");
  }
};
