export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: "user" | "admin" | "caregiver";
  caregiverId?: string;
}

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: "daily" | "weekly" | "as_needed";
  times: string[];
  duration: number;
  startDate: string;
  endDate: string;
  category: string;
  stock: number;
  minStock: number;
  description: string;
}

export interface Reminder {
  id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string; // YYYY-MM-DDTHH:mm
  status: "pending" | "taken" | "skipped";
  actualTime?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorName: string;
  specialty: string;
  dateTime: string;
  notes: string;
  address: string;
  contact: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface HealthVital {
  id: string;
  userId: string;
  type: "blood_pressure" | "blood_sugar" | "heart_rate" | "weight" | "temperature";
  value: string;
  timestamp: string;
  notes?: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "push" | "email" | "sms";
  timestamp: string;
  sent: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalMeds: number;
  totalReminders: number;
  totalAppointments: number;
  takenCount: number;
  skippedCount: number;
  pendingCount: number;
  adherenceRate: number;
  recentLogins: Array<{ id: string; fullName: string; role: string; email: string }>;
}
