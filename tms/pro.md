# 📄 Product Requirements Document (PRD)
## Supply Chain KPI Alert & Recommendation Dashboard – MVP-0

---

## 1. Product Overview

### 1.1 Purpose
Build a **web-based interactive dashboard** that ingests supply-chain shipment data, calculates key logistics KPIs, highlights KPI breaches through alerts, and provides **rule-based business recommendations** to improve performance.

This MVP is intended for:
- Client demos
- Pre-sales showcases
- Early product validation

---

### 1.2 Target Users
- Supply Chain Managers
- Logistics / Transport Heads
- Operations Excellence Teams
- CXOs (view-only)

---

### 1.3 Problem Statement
Supply-chain data today is:
- Fragmented across systems
- Hard to interpret quickly
- Reactive rather than proactive

Users need:
- Clear KPI visibility
- Automatic alerts when performance degrades
- Actionable, business-friendly recommendations

---

## 2. Scope Definition

### 2.1 In Scope (MVP-0)
- CSV / Excel data upload
- KPI computation
- Threshold-based alerts
- Rule-based recommendations
- Interactive dashboard with filters

### 2.2 Out of Scope
- Machine learning or prediction models
- Real-time data ingestion
- ERP / TMS integrations
- User authentication & roles
- Mobile-first optimization

---

## 3. Data Requirements

### 3.1 Input Data Format

Accepted formats:
- `.csv`
- `.xlsx`

| Column Name | Data Type | Description |
|------------|----------|-------------|
| Order_ID | String | Unique shipment/order identifier |
| Dispatch_Date | Date | Actual dispatch date |
| Planned_Delivery_Date | Date | Planned delivery date |
| Actual_Delivery_Date | Date | Actual delivery date |
| Quantity_Ordered | Number | Ordered quantity |
| Quantity_Delivered | Number | Delivered quantity |
| Transporter | String | Carrier name |
| Route | String | Source–Destination |
| Distance_KM | Number | Route distance |
| Freight_Cost | Number | Shipment cost |
| Shipment_Status | String | Delivered / Delayed |

---

## 4. KPI Definitions

### 4.1 Core KPIs (Mandatory)

| KPI | Definition / Formula |
|----|----------------------|
| OTIF (%) | (On-Time & In-Full Orders ÷ Total Orders) × 100 |
| OTD (%) | (On-Time Deliveries ÷ Total Orders) × 100 |
| In-Full (%) | (In-Full Deliveries ÷ Total Orders) × 100 |
| Average Transit Time | Avg(Actual Delivery Date − Dispatch Date) |
| Delay Rate (%) | (Delayed Orders ÷ Total Orders) × 100 |
| Cost per Shipment | Total Freight Cost ÷ Total Shipments |
| Cost per KM | Total Freight Cost ÷ Total Distance |

---

### 4.2 KPI Thresholds

Thresholds must be configurable constants.

| KPI | Green | Yellow | Red |
|----|------|-------|-----|
| OTIF | ≥ 90% | 80–89% | < 80% |
| OTD | ≥ 92% | 85–91% | < 85% |
| Delay Rate | ≤ 5% | 6–10% | > 10% |

---

## 5. User Interface Requirements

---

### 5.1 Page 1: Executive Dashboard

**Components**
- KPI cards: OTIF, OTD, Avg Transit Time, Delay Rate
- Each card displays:
  - KPI value
  - Status color (Green / Yellow / Red)
  - Trend indicator (↑ / ↓)

**Charts**
- OTIF trend over time
- Transporter-wise OTIF (bar chart)
- Route-wise Delay Rate (bar chart)

**Global Filters**
- Date range
- Transporter
- Route

---

### 5.2 Page 2: Alerts & Exceptions

**Alert Triggers**
- KPI crosses red threshold
- KPI drops more than 5% vs previous period

**Alert Card Fields**
- Severity (Critical / Warning)
- KPI affected
- Impact scope (Route / Transporter)
- One-line explanation

**Example**

---

## 6. Marketing Plan (Brief)

### 6.1 Positioning
- Simple, demo-ready dashboard that turns shipment data into KPIs, alerts, and clear actions in minutes.

### 6.2 Target Segments
- Mid-market manufacturers and distributors with fragmented logistics reporting.
- 3PLs and logistics providers needing KPI visibility for client reporting.
- Operations and supply chain leaders who want fast insights without heavy IT lift.

### 6.3 Key Messages
- "Upload your data, see your KPIs instantly."
- "Spot delays early and act with guided recommendations."
- "Demo in one meeting, value in one week."

### 6.4 Channels (Lightweight)
- LinkedIn posts and short demo clips (targeted by industry/job title).
- Direct outreach to supply chain leaders with a 10-minute demo offer.
- Partner referrals via logistics consultants and 3PLs.

### 6.5 Launch Assets
- One-page landing page with product snapshot, KPIs list, and demo CTA.
- 2-minute screen-recorded walkthrough.
- Sample dataset and prebuilt dashboard for live demos.

### 6.6 Success Metrics (First 30-60 Days)
- 20-30 demo requests.
- 5-8 pilot conversations.

- 2-3 paid trials or LOIs.