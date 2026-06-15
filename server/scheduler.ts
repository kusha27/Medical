import { getDatabase, saveDatabase } from "./db.js";
import { sendEmail, buildClinicalEmailHtml } from "./email.js";

/**
 * Formats a Date object to "YYYY-MM-DDTHH:mm" matching the database schema.
 * Shifts the date by the specified timezone offset (in minutes, retrieved from the browser/user model).
 */
function getFormatedDateTime(date: Date, offsetMinutes: number = 0): string {
  // Translate system UTC time to user local time using the offset in minutes
  // browser offsetMinutes is positive for West (e.g. 420 for PDT (-7 hr)), negative for East
  const utcEpoch = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
  const userLocalTime = new Date(utcEpoch - (offsetMinutes * 60 * 1000));

  const pad = (num: number) => String(num).padStart(2, "0");
  const yyyy = userLocalTime.getFullYear();
  const mm = pad(userLocalTime.getMonth() + 1);
  const dd = pad(userLocalTime.getDate());
  const hh = pad(userLocalTime.getHours());
  const min = pad(userLocalTime.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Initializes and starts the background scheduler.
 * Runs every 60 seconds to scan pending reminders and scheduled appointments.
 */
export function initializeScheduler(): void {
  console.log("[SCHEDULER ENGINE] Bootstrapping timezone-aware background monitoring daemon (Interval: 60s)...");

  // Run the checker immediately on boot and then set the interval
  checkDueRemindersAndAppointments();
  setInterval(() => {
    checkDueRemindersAndAppointments();
  }, 60 * 1000);
}

/**
 * Core scanning cycle for background notifications.
 * Computes scheduled match boundaries dynamically per active user/patient based on their browser timezone mapping.
 */
async function checkDueRemindersAndAppointments(): Promise<void> {
  const db = getDatabase();
  const now = new Date();
  
  let updatedDb = false;

  // Process alerts granularly on a per-user basis to respect timezone offsets
  for (const user of db.users) {
    const userOffset = user.timezoneOffset !== undefined ? user.timezoneOffset : 0;

    // Format current system time shifted to patient local timezone
    const currentStr = getFormatedDateTime(now, userOffset);

    // Cutoff point: 24 hours ago in user's timezone, to avoid sending massive bursts of stale expired messages
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cutoffStr = getFormatedDateTime(twentyFourHoursAgo, userOffset);

    // Cutforward for appointments (check appointments in tomorrow's 24 hours window)
    const twentyFourHoursAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const appointmentMaxStr = getFormatedDateTime(twentyFourHoursAhead, userOffset);

    // 1. SCAN DUE MEDICINE REMINDERS FOR THIS USER
    const pendingReminders = db.reminders.filter(
      (r) => r.userId === user.id &&
             r.status === "pending" && 
             !r.emailSent && 
             r.scheduledTime <= currentStr && 
             r.scheduledTime >= cutoffStr
    );

    if (pendingReminders.length > 0) {
      console.log(`[SCHEDULER ENGINE] Identified ${pendingReminders.length} due medicine reminders for ${user.fullName} (${user.email}) at Local Time: ${currentStr} (Offset: ${userOffset}m).`);
      
      for (const reminder of pendingReminders) {
        if (!user.email) {
          // Mark as sent anyway so we don't spam the background loop
          reminder.emailSent = true;
          updatedDb = true;
          continue;
        }

        // Fetch the medicine to get description / instructions
        const medicine = db.medicines.find((m) => m.id === reminder.medicineId);
        const instructions = medicine?.description || "Take with water as directed.";
        const currentStock = medicine ? medicine.stock : "N/A";

        // Formulate HTML Email Body
        const title = `Medication Alert: Time to take your ${reminder.medicineName}`;
        const emailHtml = buildClinicalEmailHtml(
          title,
          `
          <h2 style="color: #0f766e; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin-top: 0;">Prescribed Medication Alert</h2>
          <p>Dear <strong>${user.fullName}</strong>,</p>
          <p>This is an automated clinical reminder from <strong>Aegis MedRem</strong>. It is currently time to take your scheduled dosage.</p>
          
          <div class="alert-box" style="border-left: 4px solid #0d9488; background-color: #f0fdfa; padding: 16px; margin: 20px 0; border-radius: 8px;">
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 35%;">Medication:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0d9488; font-size: 16px;">${reminder.medicineName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Required Dosage:</td>
                <td style="padding: 6px 0; font-weight: bold;">${reminder.dosage}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Scheduled Time:</td>
                <td style="padding: 6px 0; font-weight: bold;">${reminder.scheduledTime.replace("T", " ")}</td>
              </tr>
              ${medicine ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Remaining Stock:</td>
                <td style="padding: 6px 0;"><span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background-color: ${medicine.stock <= medicine.minStock ? '#ffe4e6; color:#991b1b' : '#f1f5f9'}">${currentStock} doses left</span></td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold; vertical-align: top;">Clinical Instructions:</td>
                <td style="padding: 6px 0; color: #475569; font-style: italic;">"${instructions}"</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            After taking your medicine, please login to your <strong>Aegis MedRem Portal</strong> as soon as possible to mark this dosage as <strong>Taken</strong>. This allows your caregiver matching reports to track your clinical adherence score optimally.
          </p>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.APP_URL || "http://localhost:3000"}" style="display: inline-block; padding: 12px 24px; background-color: #0d9488; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(13,148,136,0.15);">Access MedRem Portal Dashboard</a>
          </div>
          `
        );

        const emailResult = await sendEmail({
          to: user.email,
          subject: `[Aegis MedRem] Time to take your ${reminder.medicineName} (${reminder.dosage})`,
          text: `Hello ${user.fullName}, this is a clinical reminder to take your ${reminder.medicineName} (${reminder.dosage}) scheduled at ${reminder.scheduledTime.replace("T", " ")}. Instructions: ${instructions}`,
          html: emailHtml
        });

        // Update Database state
        reminder.emailSent = true;
        updatedDb = true;

        // Log notification in history feed
        db.notifications.push({
          id: `not-${Math.random().toString(36).substr(2, 9)}`,
          userId: reminder.userId,
          title: `Reminder Emailed`,
          message: `Dispatched alarm notification for ${reminder.medicineName} (${reminder.dosage}) to <${user.email}>. Delivery logs: ${emailResult.log}`,
          type: "email",
          timestamp: new Date().toISOString(),
          sent: emailResult.success
        });
      }
    }

    // 2. SCAN FUTURE APPOINTMENTS (Warn 24 hours in advance) FOR THIS USER
    const pendingAppointments = db.appointments.filter(
      (a) => a.userId === user.id &&
             a.status === "scheduled" && 
             !(a as any).emailSent && 
             a.dateTime >= currentStr && 
             a.dateTime <= appointmentMaxStr
    );

    if (pendingAppointments.length > 0) {
      console.log(`[SCHEDULER ENGINE] Identified ${pendingAppointments.length} upcoming clinical appointments within 24 hours for ${user.fullName} (${user.email}) at Local Time: ${currentStr} (Offset: ${userOffset}m).`);
      
      for (const apt of pendingAppointments) {
        if (!user.email) {
          (apt as any).emailSent = true;
          updatedDb = true;
          continue;
        }

        const title = `Appointment Reminder: Scheduled with ${apt.doctorName} (${apt.specialty})`;
        const emailHtml = buildClinicalEmailHtml(
          title,
          `
          <h2 style="color: #0f766e; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px; margin-top: 0;">Clinic Appointment Briefing</h2>
          <p>Dear <strong>${user.fullName}</strong>,</p>
          <p>This is an automated prompt informing you about an upcoming medical appointment scheduled in the next 24 hours.</p>

          <div class="alert-box" style="border-left: 4px solid #0284c7; background-color: #f0f9ff; padding: 16px; margin: 20px 0; border-radius: 8px;">
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 35%;">Therapist Name:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0369a1;">${apt.doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Specialization:</td>
                <td style="padding: 6px 0;"><span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: #e0f2fe; color: #0369a1;">${apt.specialty}</span></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Scheduled Clock:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #e11d48;">${apt.dateTime.replace("T", " ")}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Clinic Address:</td>
                <td style="padding: 6px 0; color: #334155;">${apt.address || "Main Clinical Hub Block"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Doctor Contact:</td>
                <td style="padding: 6px 0; font-family: monospace;">${apt.contact || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold; vertical-align: top;">Appointment Notes:</td>
                <td style="padding: 6px 0; color: #475569; font-style: italic;">"${apt.notes || "No extra medical preparations listed."}"</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.APP_URL || "http://localhost:3000"}" style="display: inline-block; padding: 12px 24px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(2,132,199,0.15);">Manage Appointment Registry</a>
          </div>
          `
        );

        const emailResult = await sendEmail({
          to: user.email,
          subject: `[Aegis MedRem] Appointment Reminder tomorrow: ${apt.doctorName} (${apt.specialty})`,
          text: `Hello ${user.fullName}, you have an appointment tomorrow at ${apt.dateTime.replace("T", " ")} with ${apt.doctorName} (${apt.specialty}). Location: ${apt.address}`,
          html: emailHtml
        });

        (apt as any).emailSent = true;
        updatedDb = true;

        // Log notification in database
        db.notifications.push({
          id: `not-${Math.random().toString(36).substr(2, 9)}`,
          userId: apt.userId,
          title: `Appointment Briefing Sent`,
          message: `Dispatched upcoming consultation brief to <${user.email}> with ${apt.doctorName}. Delivery details: ${emailResult.log}`,
          type: "email",
          timestamp: new Date().toISOString(),
          sent: emailResult.success
        });
      }
    }
  }

  // 3. PERSIST STATE CHANGES IF DELIVERED REMINDERS OR APPOINTMENTS WERE UPDATED
  if (updatedDb) {
    saveDatabase(db);
  }
}
