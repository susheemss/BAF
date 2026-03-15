/**
 * POST /api/alerts/test
 * Sends a single test email to verify credentials are working.
 */
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { to } = await req.json() as { to: string };

  if (!process.env.ALERT_FROM_EMAIL || !process.env.ALERT_APP_PASSWORD) {
    return NextResponse.json({
      ok: false,
      error: "ALERT_FROM_EMAIL and ALERT_APP_PASSWORD must be set in .env.local",
    }, { status: 400 });
  }

  const transport = nodemailer.createTransport({
    host:   "smtp.gmail.com",
    port:   587,
    secure: false,
    auth: {
      user: process.env.ALERT_FROM_EMAIL,
      pass: process.env.ALERT_APP_PASSWORD,
    },
  });

  try {
    await transport.sendMail({
      from:    `"Supply Chain Intelligence Platform" <${process.env.ALERT_FROM_EMAIL}>`,
      to,
      subject: "✅ Test Alert — Supply Chain Intelligence Platform",
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#0B1F3B,#1E3A5F);padding:28px 32px;">
            <div style="font-size:18px;font-weight:700;color:#fff;">Supply Chain Intelligence Platform</div>
            <div style="font-size:12px;color:#94A3B8;margin-top:4px;">Alert System · Connection Test</div>
          </div>
          <div style="padding:28px 32px;">
            <div style="font-size:32px;margin-bottom:12px;">✅</div>
            <div style="font-size:18px;font-weight:700;color:#1E293B;margin-bottom:8px;">Email alerts are working correctly.</div>
            <div style="font-size:14px;color:#64748B;line-height:1.7;">
              Your alert system is configured and ready. KPI breach notifications will be sent to this address automatically whenever a threshold is crossed.
            </div>
            <div style="margin-top:20px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:14px 18px;font-size:12px;color:#166534;">
              From: ${process.env.ALERT_FROM_EMAIL}<br/>
              To: ${to}<br/>
              Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, message: `Test email sent to ${to}` });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
