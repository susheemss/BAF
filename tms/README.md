# TMS Supply Chain KPI Dashboard MVP

## Setup

1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run dev`

## Data Upload

Use the Upload page to import CSV or XLSX data with the required columns:
`Shipment ID, Load ID, Date, Month, Year, Carrier Name, Mode of Transport, Product Type, Origin Country, Origin Region, Origin State, Origin City, Origin Zipcode, Origin Area, Destination Country, Destination Region, Destination State, Destination City, Destination Zipcode, Destination Area, Distance_km, Total_Weight_in_Shipment_kg, Transit Time (Days), Operational Status, Shipment Cost (USD), Shipment Planned, Equipment, Equipment Weight Capacity (KG), Equipment_VolumeCapacity_m3, Total Volume in Shipment_m3, Tendered Status, Estimated Delivery Date, Actual_Delivery_Date, Delays, On-Time / Delayed / In-Transit, Shipment Order Type`.

## Demo Upload

Use the Upload page to load `sample_sc_data.csv` for a quick demo.

## Login (Demo)

Use any email/password on the landing page to enter the dashboard.

## Chatbot (OpenAI)

- Set `OPENAI_API_KEY` in your environment.
- Use the floating Chat button inside the app.

## Supabase (Live Data)

1) Create a Supabase project and run `supabase/schema.sql`.
2) Set these in `.env.local`:

```
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3) Use the Upload page to sync CSV data to Supabase.
4) Toggle "Live Sync On" to auto-refresh from Supabase every 30 seconds.

## Email Alerts (Gmail SMTP)

Set these in `.env.local`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_gmail_address
SMTP_PASS=your_app_password
ALERT_RECIPIENTS=comma,separated,emails
ALERT_SUBJECT_PREFIX=KPI Alert
```
