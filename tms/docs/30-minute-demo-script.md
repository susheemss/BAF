# 30-Minute Product Demo Script (Word-for-Word)

## Use This Exactly
- Audience: executives + operations stakeholders
- Duration: 30 minutes total
- Product: TMS KPI dashboard with live map, AI assistant, alerts, and customer communication workflow

---

## 0:00 - 1:30 | Opening

### What to say
"Good [morning/afternoon], thank you for your time.  
Today I will show you how we turn shipment data into KPI visibility, operational alerts, live shipment tracking, and immediate customer communication actions in one platform.  
The objective of this demo is simple: faster decisions, fewer delays, and better executive control."

"In the next 30 minutes, I will cover four parts:  
one, executive KPI monitoring;  
two, exception and risk visibility;  
three, live shipment operations and customer communication;  
four, AI-assisted insights and voice-enabled workflows."

---

## 1:30 - 4:00 | Data Foundation and Login

### On-screen actions
1. Show login page and sign in.
2. Briefly navigate to Upload page.
3. Confirm data is loaded and live sync state.

### What to say
"I’ll start with the data foundation.  
This workspace accepts shipment data from CSV/XLSX and can sync to Supabase for persistent, shared, live data."

"The value here is that teams are not working from isolated spreadsheets anymore.  
Everyone sees the same operational truth."

"Now I’ll move to the executive dashboard."

---

## 4:00 - 11:00 | Executive Dashboard

### On-screen actions
1. Open Dashboard.
2. Use filters: date range, carrier, mode, route.
3. Point to KPI cards.
4. Scroll through trends/charts and drilldown.
5. Click **Generate Brief**.
6. Click **Download Brief**.

### What to say
"This is the executive command view.  
At the top, we apply filters to focus by period, carrier, mode, origin, destination, and route."

"Now you can see KPI cards update instantly for the selected scope.  
The primary metrics are On-Time Rate, Delay Rate, Average Transit Time, and Cost per Shipment."

"Below, we provide trend and drilldown views:  
carrier on-time performance, route delay risk, and high-cost route identification."

"This allows leadership to answer three questions quickly:  
Where are we failing?  
What is the financial exposure?  
What should we prioritize this week?"

"Now I’ll generate the executive brief from the exact filtered data on screen."

"This brief is automatically produced from current KPI state and route/carrier risk context.  
It is designed for leadership updates and can be downloaded and shared immediately."

"This removes manual reporting effort and reduces delay between analysis and action."

---

## 11:00 - 15:00 | KPI Pages (Cost, Operations, Carrier)

### On-screen actions
1. Open KPI tabs (`/kpis/cost`, `/kpis/operations`, `/kpis/carriers`).
2. Show gauge thresholds and performance status.

### What to say
"Now I’ll switch to the KPI-specific views."

"In Cost Management, we track freight cost per shipment and cost per mile against threshold bands."

"In Operations, we focus on On-Time Delivery and Transit Variance."

"In Carrier Performance, we monitor carrier reliability and tender acceptance."

"This structure helps each function consume focused insights without losing the shared system context."

---

## 15:00 - 19:00 | Alerts and Exceptions

### On-screen actions
1. Open Alerts page.
2. Apply filter and show alert list changes.
3. Click **Send Alert** (if configured).

### What to say
"This page highlights exceptions based on KPI thresholds and trend degradation."

"When thresholds are crossed, alerts are raised with severity and scope, so teams don’t have to manually scan all metrics."

"I’ll apply a filter so you can see how alerts respond to operational scope."

"This is the operational heartbeat: fewer surprises and faster escalation."

"If enabled, the platform can also trigger alert emails directly from this context."

---

## 19:00 - 25:00 | Live Map + Customer Communication Workflow

### On-screen actions
1. Open Live Map.
2. Apply filters and adjust **Max Loads on Map**.
3. Hover a shipment icon to show details.
4. Click the same icon.
5. In Customer Mail Assistant, click **Draft**.
6. Click **Send** to open Gmail compose with prefilled subject/body.

### What to say
"Now we move from KPI monitoring to operational execution."

"This live map gives real-time shipment visibility with controllable load density for clarity during active operations."

"When I hover a shipment icon, I get route, carrier, status, lead-time, and CO2 context."

"Now I click this shipment and generate a customer update draft."

"The draft is context-aware and pre-populated from the selected shipment, which reduces manual communication delay."

"When I click Send, Gmail opens with the full message populated.  
The operator only needs to enter recipient email and send."

"This directly connects visibility to customer communication action in seconds."

---

## 25:00 - 28:00 | AI and Voice Capabilities

### On-screen actions
1. Open Chat widget.
2. Ask one typed question.
3. Use mic once for voice query (if configured).
4. Optionally show Vapi panel on Alerts page for voice call experience.

### What to say
"The platform includes an AI assistant for faster interpretation and decision support."

"Users can ask KPI questions in text or voice, and get concise, action-oriented responses."

"Voice workflows reduce friction for frontline teams, especially during active incident windows."

"We also support AI-assisted call experiences for escalation workflows, depending on deployment configuration."

---

## 28:00 - 30:00 | Close and Next Steps

### What to say
"To summarize, this platform gives you:  
one, executive KPI visibility;  
two, exception-driven prioritization;  
three, live operational control;  
four, immediate customer communication;  
five, AI-assisted analysis and voice workflows."

"The business impact is shorter response time, reduced delay risk, and higher confidence in decision-making."

"As a next step, we can run a focused pilot with your data and define measurable targets on on-time performance, delay reduction, and reporting turnaround."

"Thank you. I’m happy to take questions."

---

## Q&A Backup Lines (Use as Needed)

### If asked about data reliability
"All KPI outputs are computed from shipment-level records with explicit formulas and filter context.  
The same filtered dataset drives charts, alerts, and brief generation."

### If asked about scalability
"Current architecture works well for pilot scale.  
For larger volumes, we can shift heavy aggregations to database-side pre-aggregation and keep API response times low."

### If asked about AI hallucination
"For decision-critical views, we use deterministic KPI logic and rule-based outputs.  
AI is used for interpretation and communication acceleration, not as a replacement for numeric truth."

### If asked about security
"Secrets are handled as server-side environment variables, and production deployment isolates API access through controlled backend routes."

---

## Final Demo Checklist (5 minutes before meeting)

1. Open deployed URL and verify login.
2. Check Dashboard loads data and filters update KPIs.
3. Click Generate Brief once.
4. Check Alerts page loads.
5. On Live Map, click icon -> Draft -> Send path once.
6. Test chat text once.
7. Keep one fallback line ready:
"If this integration is temporarily unavailable, I’ll continue with the deterministic KPI and operations flow."
