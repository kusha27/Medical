import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "server_db.json");

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin" | "caregiver";
  caregiverId?: string; // Links user to caregiver
}

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: "daily" | "weekly" | "as_needed";
  times: string[]; // e.g. ["08:00", "20:00"]
  duration: number; // in days
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  category: string; // "Tablet", "Capsule", "Injection", "Syrup", "Other"
  stock: number;
  minStock: number; // Alerts when stock is less than this
  description: string;
}

export interface Reminder {
  id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string; // "YYYY-MM-DDTHH:mm"
  status: "pending" | "taken" | "skipped";
  actualTime?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorName: string;
  specialty: string;
  dateTime: string; // YYYY-MM-DDTHH:mm
  notes: string;
  address: string;
  contact: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface HealthVital {
  id: string;
  userId: string;
  type: "blood_pressure" | "blood_sugar" | "heart_rate" | "weight" | "temperature";
  value: string; // e.g., "120/80" or "95"
  timestamp: string; // ISO String
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

export interface DatabaseSchema {
  users: User[];
  medicines: Medicine[];
  reminders: Reminder[];
  appointments: Appointment[];
  vitals: HealthVital[];
  notifications: SystemNotification[];
}

const DEFAULT_DB: DatabaseSchema = {
  users: [
    {
      id: "admin-1",
      username: "admin",
      fullName: "System Admin",
      email: "admin@medicalreminder.com",
      passwordHash: "admin123", // Keep simply validated for development
      role: "admin",
    },
    {
      id: "demo-user",
      username: "demo",
      fullName: "Jane Doe (Patient)",
      email: "jane@example.com",
      passwordHash: "demo123",
      role: "user",
      caregiverId: "demo-caregiver",
    },
    {
      id: "demo-caregiver",
      username: "caregiver",
      fullName: "John Doe (Caregiver)",
      email: "john@example.com",
      passwordHash: "demo123",
      role: "caregiver",
    }
  ],
  medicines: [
    {
      id: "med-1",
      userId: "demo-user",
      name: "Atorvastatin",
      dosage: "10mg",
      frequency: "daily",
      times: ["08:00"],
      duration: 30,
      startDate: "2026-06-10",
      endDate: "2026-07-10",
      category: "Tablet",
      stock: 25,
      minStock: 5,
      description: "Take in the morning with food. Cholesterol regulation."
    },
    {
      id: "med-2",
      userId: "demo-user",
      name: "Amoxicillin",
      dosage: "500mg",
      frequency: "daily",
      times: ["08:00", "20:00"],
      duration: 7,
      startDate: "2026-06-12",
      endDate: "2026-06-19",
      category: "Capsule",
      stock: 4,
      minStock: 6, // triggers low inventory warning right away
      description: "Antibiotics course. Complete full duration."
    }
  ],
  reminders: [
    // Prepopulated reminders matching demo dates
    {
      id: "rem-1",
      userId: "demo-user",
      medicineId: "med-1",
      medicineName: "Atorvastatin",
      dosage: "10mg",
      scheduledTime: "2026-06-13T08:00",
      status: "taken",
      actualTime: "2026-06-13T08:15"
    },
    {
      id: "rem-2",
      userId: "demo-user",
      medicineId: "med-2",
      medicineName: "Amoxicillin",
      dosage: "5000mg",
      scheduledTime: "2026-06-13T08:00",
      status: "taken",
      actualTime: "2026-06-13T08:05"
    },
    {
      id: "rem-3",
      userId: "demo-user",
      medicineId: "med-2",
      medicineName: "Amoxicillin",
      dosage: "500mg",
      scheduledTime: "2026-06-13T20:00",
      status: "skipped",
      notes: "Felt nauseous"
    }
  ],
  appointments: [
    {
      id: "apt-1",
      userId: "demo-user",
      doctorName: "Dr. Elizabeth Carter",
      specialty: "Cardiology",
      dateTime: "2026-06-18T10:30",
      notes: "Six-month cardiac routine checkup. Bring recent BP records.",
      address: "Heart & Vascular Clinic, Suite 402",
      contact: "(555) 123-4567",
      status: "scheduled"
    },
    {
      id: "apt-2",
      userId: "demo-user",
      doctorName: "Dr. Sarah Taylor",
      specialty: "General Physician",
      dateTime: "2026-06-12T14:15",
      notes: "Follow up on generic weakness & post-infection checkup.",
      address: "Downtown Health Partners, Building B",
      contact: "(555) 987-6543",
      status: "completed"
    }
  ],
  vitals: [
    {
      id: "v-1",
      userId: "demo-user",
      type: "blood_pressure",
      value: "122/81",
      timestamp: "2026-06-10T12:00:00.000Z",
      notes: "Post lunch reading"
    },
    {
      id: "v-2",
      userId: "demo-user",
      type: "blood_pressure",
      value: "119/79",
      timestamp: "2026-06-12T09:30:00.000Z"
    },
    {
      id: "v-3",
      userId: "demo-user",
      type: "blood_sugar",
      value: "95",
      timestamp: "2026-06-11T07:15:00.000Z",
      notes: "Fasting"
    },
    {
      id: "v-4",
      userId: "demo-user",
      type: "heart_rate",
      value: "72",
      timestamp: "2026-06-13T15:45:00.000Z"
    },
    {
      id: "v-5",
      userId: "demo-user",
      type: "weight",
      value: "68.4",
      timestamp: "2026-06-13T07:00:00.000Z"
    }
  ],
  notifications: [
    {
      id: "not-1",
      userId: "demo-user",
      title: "Medication Scheduled",
      message: "It is time to take Atorvastatin 10mg",
      type: "push",
      timestamp: "2026-06-13T08:00:00.000Z",
      sent: true
    }
  ]
};

export function getDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Database access error, reverting to in-memory:", err);
    return DEFAULT_DB;
  }
}

export function saveDatabase(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Database save error:", err);
  }
}
