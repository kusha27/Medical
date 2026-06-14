# Aegis MedRem — Full-Stack Medical Reminder Application

A complete, high-fidelity full-stack **Medical Reminder & Adherence Supervision Portal** built for final-year engineering project evaluation. 

## 🌟 Primary Capabilities

1. **Patient Care Dashboard**: 
   - Interactive calendar widget indicating active treatment courses.
   - Live checklists permitting patients to clock doses taken or skipped with custom notes.
   - Instant visual alerts for low medication inventories.
2. **Cognitive Vision Prescription OCR**: 
   - Snaps photos or accepts file uploads of doctor handwriting.
   - Utilizes advanced **Gemini Core** server-side parsing to decipher brand names, strengths, frequencies, and durations.
3. **Diagnostics Vital Tracker**: 
   - Logs metrics like Blood Pressure, Fasting Glucose Blood Sugar, Pulse Heart Rates, Temperature, and Weighings.
   - Plots trends dynamically over a custom canvas using **Recharts Area Graphics**.
4. **Caregiver Passive Monitoring**: 
   - Binds secure observing guardians via username codes.
   - Caregivers get an immersive live dashboard overlay supervising adherence compliance constants and diagnostic trends in real-time.
5. **Simulated Push, Email, & SMS Carrier Dispatch**:
   - Interactive Testing Studio allowing direct simulation of automated text messages, emergency family checkup emails, and in-app banners.
6. **Supervisor Admin Cabinet**:
   - Authorized personnel get real-time terminal views monitoring the background reminder generation daemons and database aggregates.

---

## 🛠️ Technology Stack
- **Frontend SPA**: React 19, Vite 6, Tailwind CSS v4, Lucide Icons, Recharts SVG.
- **Backend Server**: Node.js, Express.js, JWT security Base64 adapters, Node Cron simulators, Gemini Generative AI SDK, JSON Database persistency.

---

## 🚀 How to Run the Project

### Local Installation
```bash
# 1. Install all system dependencies
npm install

# 2. Start full-stack Node.js server with active live reload
npm run dev
```

The application mounts and hosts automatically at: `http://localhost:3000`

---

## 📁 System Architecture
- `/server.ts` : Central Express.js application controller handling API endpoints and Vite middleware routing.
- `/server/db.ts` : Safe JSON-based database adapter populated with rich preloaded demo user credentials.
- `/src/types.ts` : Centralized TypeScript interfaces for clinical and tracking schemas.
- `/src/api.ts` : Safe API proxy driver handling state headers and OCR.
- `/src/components/*` : Single-page components representing modular visual portals.
