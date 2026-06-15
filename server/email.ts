import nodemailer from "nodemailer";

/**
 * Interface representing custom email message payload.
 */
export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Creates and configures the Nodemailer transport based on env variables.
 * Falls back to detailed console logger instructions if SMTP credentials are missing.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; log: string }> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"${user || "Aegis MedRem"}" <${user || "notifications@aegismedrem.local"}>`;

  // Validate presence of credentials
  if (!host || !user || !pass) {
    const missing = [];
    if (!host) missing.push("SMTP_HOST");
    if (!user) missing.push("SMTP_USER");
    if (!pass) missing.push("SMTP_PASS");

    const message = `[EMAIL OFFLINE] Could not deliver email to <${payload.to}>. Missing env secrets: ${missing.join(", ")}. Please configure SMTP secrets in your environment settings.`;
    console.warn(message);
    
    return {
      success: false,
      log: message
    };
  }

  try {
    // Configure secure connection if port is 465, otherwise use STARTTLS
    const isSecure = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass,
      },
      tls: {
        // Prevent SSL handshake failures with custom domains
        rejectUnauthorized: false
      }
    });

    console.log(`[SMTP] Attempting email collection delivery to <${payload.to}> via ${host}:${port}...`);

    const info = await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    const successLog = `[EMAIL DELIVERED] Real email successfully sent to <${payload.to}> via SMTP | MessageID=${info.messageId}`;
    console.log(successLog);

    return {
      success: true,
      log: successLog
    };
  } catch (error: any) {
    const errorLog = `[EMAIL ERROR] SMTP connection failed when mailing <${payload.to}>: ${error?.message || error}`;
    console.error(errorLog);
    return {
      success: false,
      log: errorLog
    };
  }
}

/**
 * Elegant clinical brand layout styling wrapper.
 */
export function buildClinicalEmailHtml(title: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 24px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background-color: #0d9488; padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; tracking-spacing: -0.025em; text-transform: uppercase; letter-spacing: 1px; }
        .header p { margin: 8px 0 0 0; font-size: 13px; color: #ccfbf1; font-weight: 500; }
        .content { padding: 32px 24px; font-size: 15px; line-height: 1.6; color: #334155; }
        .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 4px 0; font-size: 11px; color: #64748b; font-weight: 600; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: #ffffff !important; font-weight: 700; text-decoration: none; border-radius: 8px; margin-top: 16px; font-size: 13px; text-align: center; }
        .btn:hover { background-color: #0f766e; }
        .badge { display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: bold; color: #475569; font-family: monospace; }
        .alert-box { background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; border-radius: 4px 8px 8px 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>Aegis MedRem</h1>
            <p>Clinical Adherence Supervision & Reminders Portal</p>
          </div>
          <div class="content">
            ${bodyHtml}
          </div>
          <div class="footer">
            <p>© 2026 Aegis Health Portal. All Rights Reserved.</p>
            <p>You received this because email notifications are activated inside your Clinical settings profile.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
