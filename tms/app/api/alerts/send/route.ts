import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type RedKpi = {
  label: string;
  value: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT ?? "0");
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  const recipients = process.env.ALERT_RECIPIENTS ?? "";
  const subjectPrefix = process.env.ALERT_SUBJECT_PREFIX ?? "KPI Alert";

  if (!host || !port || !user || !pass || !recipients) {
    return NextResponse.json(
      { error: "SMTP environment variables are not configured." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const redKpis = (body.redKpis as RedKpi[]) ?? [];
  const context = body.context ?? {};

  if (redKpis.length === 0) {
    return NextResponse.json({ error: "No red KPIs to send." }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const list = redKpis
    .map((item) => `- ${item.label}: ${item.value}`)
    .join("\n");

  const text = `Red KPI Alert\n\n${list}\n\nFilters:\n${JSON.stringify(
    context,
    null,
    2
  )}`;

  await transporter.sendMail({
    from: user,
    to: recipients,
    subject: `${subjectPrefix} - Red KPIs`,
    text
  });

  return NextResponse.json({ ok: true });
}
