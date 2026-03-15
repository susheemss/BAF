"""
Demo Data Generator — Indian FMCG Supply Chain
Generates realistic datasets for WMS, TMS, and Planning tools.
All datasets share consistent Shipment IDs so KPIs cross-link.

Output files (in same directory):
  wms_inbound_receipts.csv
  wms_receiving_accuracy.csv
  wms_yard_activity.csv
  wms_outbound_orders.csv
  wms_shipment_lifecycle.csv
  wms_integration_errors.csv
  wms_event_errors.csv
  tms_shipments.csv
  planning_demand_supply.csv
"""

import random
import csv
import math
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

# ─── Config ───────────────────────────────────────────────────────────────────

START_DATE = datetime(2024, 9, 1)
END_DATE   = datetime(2025, 2, 28)
TOTAL_DAYS = (END_DATE - START_DATE).days

WAREHOUSES   = ["DEL", "MUM", "BLR"]
SHIFTS       = ["Shift A", "Shift B", "Shift C"]
TEAMS        = ["Team 1", "Team 2", "Team 3"]

CARRIERS = [
    "Blue Dart",
    "Delhivery",
    "DTDC",
    "Gati Kinetic",
    "Ekart Logistics",
]

CARRIER_PERF = {          # (on_time_prob, avg_transit_days, cost_per_km)
    "Blue Dart":        (0.94, 2.1, 3.2),
    "Delhivery":        (0.91, 2.4, 2.6),
    "DTDC":             (0.87, 2.9, 2.2),
    "Gati Kinetic":     (0.89, 2.7, 2.4),
    "Ekart Logistics":  (0.85, 3.2, 2.0),
}

SKUS = [
    # (sku_id, category, unit_weight_kg, unit_vol_m3, unit_cost_inr)
    ("SKU-001", "Personal Care",    0.25, 0.0003, 180),
    ("SKU-002", "Personal Care",    0.40, 0.0005, 320),
    ("SKU-003", "Personal Care",    0.15, 0.0002, 95),
    ("SKU-004", "Food & Beverages", 1.00, 0.0012, 210),
    ("SKU-005", "Food & Beverages", 0.50, 0.0006, 145),
    ("SKU-006", "Food & Beverages", 2.00, 0.0024, 480),
    ("SKU-007", "Food & Beverages", 0.80, 0.0009, 190),
    ("SKU-008", "Household",        1.50, 0.0018, 350),
    ("SKU-009", "Household",        2.50, 0.0030, 620),
    ("SKU-010", "Household",        0.60, 0.0007, 275),
    ("SKU-011", "Personal Care",    0.35, 0.0004, 240),
    ("SKU-012", "Food & Beverages", 0.90, 0.0011, 165),
    ("SKU-013", "Household",        1.20, 0.0014, 410),
    ("SKU-014", "Personal Care",    0.20, 0.0002, 115),
    ("SKU-015", "Food & Beverages", 3.00, 0.0036, 540),
    ("SKU-016", "Household",        4.00, 0.0048, 890),
    ("SKU-017", "Personal Care",    0.55, 0.0007, 380),
    ("SKU-018", "Food & Beverages", 0.70, 0.0008, 225),
    ("SKU-019", "Household",        1.80, 0.0022, 560),
    ("SKU-020", "Personal Care",    0.30, 0.0004, 195),
    ("SKU-021", "Food & Beverages", 1.10, 0.0013, 300),
    ("SKU-022", "Household",        2.20, 0.0026, 740),
    ("SKU-023", "Personal Care",    0.45, 0.0006, 270),
    ("SKU-024", "Food & Beverages", 0.65, 0.0008, 180),
    ("SKU-025", "Household",        3.50, 0.0042, 980),
    ("SKU-026", "Personal Care",    0.28, 0.0003, 155),
    ("SKU-027", "Food & Beverages", 1.40, 0.0017, 360),
    ("SKU-028", "Household",        0.90, 0.0011, 290),
    ("SKU-029", "Personal Care",    0.60, 0.0007, 430),
    ("SKU-030", "Food & Beverages", 2.50, 0.0030, 650),
]

SUPPLIERS = [
    ("SUP-001", "Hindustan Unilever Ltd",     "MUM", "Maharashtra", "Mumbai"),
    ("SUP-002", "ITC Limited",                "KOL", "West Bengal", "Kolkata"),
    ("SUP-003", "Nestle India",               "DEL", "Delhi",       "Delhi"),
    ("SUP-004", "Procter & Gamble India",     "MUM", "Maharashtra", "Pune"),
    ("SUP-005", "Dabur India",                "DEL", "Uttar Pradesh","Ghaziabad"),
    ("SUP-006", "Godrej Consumer Products",   "MUM", "Maharashtra", "Mumbai"),
    ("SUP-007", "Emami Limited",              "KOL", "West Bengal", "Kolkata"),
    ("SUP-008", "Marico Industries",          "MUM", "Maharashtra", "Mumbai"),
]

WH_CITY = {
    "DEL": ("Delhi",     "Delhi",       "North",    "India", "110001"),
    "MUM": ("Mumbai",    "Maharashtra", "West",     "India", "400001"),
    "BLR": ("Bangalore", "Karnataka",   "South",    "India", "560001"),
}

CUSTOMER_CITIES = [
    ("Ahmedabad",  "Gujarat",        "West",  "India", "380001"),
    ("Jaipur",     "Rajasthan",      "North", "India", "302001"),
    ("Lucknow",    "Uttar Pradesh",  "North", "India", "226001"),
    ("Hyderabad",  "Telangana",      "South", "India", "500001"),
    ("Chennai",    "Tamil Nadu",     "South", "India", "600001"),
    ("Pune",       "Maharashtra",    "West",  "India", "411001"),
    ("Chandigarh", "Punjab",         "North", "India", "160001"),
    ("Kochi",      "Kerala",         "South", "India", "682001"),
    ("Bhopal",     "Madhya Pradesh", "Central","India","462001"),
    ("Nagpur",     "Maharashtra",    "West",  "India", "440001"),
]

EQUIPMENT_TYPES = [
    ("20ft Container",  18000, 28.0),
    ("32ft Container",  25000, 38.0),
    ("LCV",              3500,  9.0),
    ("MCV",              8000, 18.0),
    ("Reefer 20ft",     15000, 26.0),
]

WH_DISTANCES = {   # approximate km between warehouses and supplier/customer cities
    "DEL": {"DEL":30, "MUM":1415, "BLR":2150, "KOL":1530,
            "Ahmedabad":930, "Jaipur":280, "Lucknow":555,
            "Hyderabad":1570, "Chennai":2180, "Pune":1460,
            "Chandigarh":250, "Kochi":2700, "Bhopal":770, "Nagpur":1080},
    "MUM": {"DEL":1415, "MUM":30, "BLR":985, "KOL":2080,
            "Ahmedabad":530, "Jaipur":1160, "Lucknow":1450,
            "Hyderabad":710, "Chennai":1330, "Pune":150,
            "Chandigarh":1570, "Kochi":1210, "Bhopal":780, "Nagpur":830},
    "BLR": {"DEL":2150, "MUM":985, "BLR":30, "KOL":1870,
            "Ahmedabad":1490, "Jaipur":1900, "Lucknow":2070,
            "Hyderabad":565, "Chennai":350, "Pune":840,
            "Chandigarh":2300, "Kochi":640, "Bhopal":1450, "Nagpur":1060},
}


def rand_date(start: datetime, end: datetime) -> datetime:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta),
                             hours=random.randint(6, 20),
                             minutes=random.randint(0, 59))


def fmt(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def fmtd(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def shipment_id(prefix: str, n: int) -> str:
    return f"{prefix}-{n:05d}"


# ─── 1. TMS Shipments ─────────────────────────────────────────────────────────

def generate_tms_shipments(n_inbound=600, n_outbound=900):
    rows = []
    sid = 1

    # Inbound: Supplier → Warehouse
    for _ in range(n_inbound):
        wh = random.choice(WAREHOUSES)
        sup = random.choice(SUPPLIERS)
        carrier = random.choice(CARRIERS)
        on_time_prob, avg_transit, cpm = CARRIER_PERF[carrier]

        dispatch_date = rand_date(START_DATE, END_DATE - timedelta(days=10))
        transit_days = max(1, int(random.gauss(avg_transit, 0.6)))
        est_delivery = dispatch_date + timedelta(days=transit_days)

        delayed = random.random() > on_time_prob
        delay_days = random.randint(1, 4) if delayed else 0
        actual_delivery = est_delivery + timedelta(days=delay_days)
        on_time_status = "Delayed" if delayed else "On-Time"

        sku = random.choice(SKUS)
        qty = random.randint(200, 2000)
        weight_kg = round(qty * sku[2] * random.uniform(0.95, 1.05), 1)
        vol_m3 = round(qty * sku[3] * random.uniform(0.95, 1.05), 4)

        equip = random.choice(EQUIPMENT_TYPES)
        dist_key = sup[2]  # supplier city code
        dist = WH_DISTANCES[wh].get(dist_key, WH_DISTANCES[wh].get(
            sup[4], 1000))
        dist_km = dist + random.randint(-50, 50)
        cost = round(dist_km * cpm * random.uniform(0.9, 1.1), 2)

        wh_city, wh_state, wh_region, wh_country, wh_zip = WH_CITY[wh]
        month_num = dispatch_date.month
        month_name = dispatch_date.strftime("%B")

        rows.append({
            "Shipment ID": shipment_id("SHP", sid),
            "Load ID": shipment_id("LD", sid),
            "Date": fmtd(dispatch_date),
            "Month": month_name,
            "Year": dispatch_date.year,
            "Carrier Name": carrier,
            "Mode of Transport": "Road",
            "Product Type": sku[1],
            "Origin Country": "India",
            "Origin Region": "North" if sup[2] in ["DEL"] else ("East" if sup[2] == "KOL" else "West"),
            "Origin State": sup[3],
            "Origin City": sup[4],
            "Origin Zipcode": "000000",
            "Origin Area": sup[4],
            "Destination Country": wh_country,
            "Destination Region": wh_region,
            "Destination State": wh_state,
            "Destination City": wh_city,
            "Destination Zipcode": wh_zip,
            "Destination Area": wh_city,
            "Distance_km": dist_km,
            "Total_Weight_in_Shipment_kg": weight_kg,
            "Transit Time (Days)": transit_days,
            "Operational Status": "Delivered",
            "Shipment Cost (USD)": cost,
            "Shipment Planned": fmtd(dispatch_date),
            "Equipment": equip[0],
            "Equipment Weight Capacity (KG)": equip[1],
            "Equipment_VolumeCapacity_m3": equip[2],
            "Total Volume in Shipment_m3": min(vol_m3, equip[2]),
            "Tendered Status": "Accepted" if random.random() > 0.08 else "Rejected",
            "Estimated Delivery Date": fmtd(est_delivery),
            "Actual_Delivery_Date": fmtd(actual_delivery),
            "Delays": delay_days,
            "On-Time / Delayed / In-Transit": on_time_status,
            "Shipment Order Type": "Inbound",
            "_wh": wh,
            "_actual_delivery": actual_delivery,
            "_sku": sku[0],
            "_qty": qty,
        })
        sid += 1

    # Outbound: Warehouse → Customer
    for _ in range(n_outbound):
        wh = random.choice(WAREHOUSES)
        cust = random.choice(CUSTOMER_CITIES)
        carrier = random.choice(CARRIERS)
        on_time_prob, avg_transit, cpm = CARRIER_PERF[carrier]

        dispatch_date = rand_date(START_DATE, END_DATE - timedelta(days=10))
        transit_days = max(1, int(random.gauss(avg_transit + 0.5, 0.8)))
        est_delivery = dispatch_date + timedelta(days=transit_days)

        delayed = random.random() > on_time_prob
        delay_days = random.randint(1, 5) if delayed else 0
        actual_delivery = est_delivery + timedelta(days=delay_days)
        on_time_status = "Delayed" if delayed else "On-Time"

        sku = random.choice(SKUS)
        qty = random.randint(50, 500)
        weight_kg = round(qty * sku[2] * random.uniform(0.95, 1.05), 1)
        vol_m3 = round(qty * sku[3] * random.uniform(0.95, 1.05), 4)

        equip = random.choice(EQUIPMENT_TYPES)
        dist_km = WH_DISTANCES[wh].get(cust[0], 1000) + random.randint(-30, 30)
        cost = round(dist_km * cpm * random.uniform(0.9, 1.1), 2)

        wh_city, wh_state, wh_region, wh_country, wh_zip = WH_CITY[wh]

        rows.append({
            "Shipment ID": shipment_id("SHP", sid),
            "Load ID": shipment_id("LD", sid),
            "Date": fmtd(dispatch_date),
            "Month": dispatch_date.strftime("%B"),
            "Year": dispatch_date.year,
            "Carrier Name": carrier,
            "Mode of Transport": "Road",
            "Product Type": sku[1],
            "Origin Country": wh_country,
            "Origin Region": wh_region,
            "Origin State": wh_state,
            "Origin City": wh_city,
            "Origin Zipcode": wh_zip,
            "Origin Area": wh_city,
            "Destination Country": "India",
            "Destination Region": cust[2],
            "Destination State": cust[1],
            "Destination City": cust[0],
            "Destination Zipcode": cust[4],
            "Destination Area": cust[0],
            "Distance_km": dist_km,
            "Total_Weight_in_Shipment_kg": weight_kg,
            "Transit Time (Days)": transit_days,
            "Operational Status": "Delivered",
            "Shipment Cost (USD)": cost,
            "Shipment Planned": fmtd(dispatch_date),
            "Equipment": equip[0],
            "Equipment Weight Capacity (KG)": equip[1],
            "Equipment_VolumeCapacity_m3": equip[2],
            "Total Volume in Shipment_m3": min(vol_m3, equip[2]),
            "Tendered Status": "Accepted" if random.random() > 0.08 else "Rejected",
            "Estimated Delivery Date": fmtd(est_delivery),
            "Actual_Delivery_Date": fmtd(actual_delivery),
            "Delays": delay_days,
            "On-Time / Delayed / In-Transit": on_time_status,
            "Shipment Order Type": "Outbound",
            "_wh": wh,
            "_actual_delivery": actual_delivery,
            "_sku": sku[0],
            "_qty": qty,
        })
        sid += 1

    return rows


# ─── 2. WMS Inbound Receipts ──────────────────────────────────────────────────

def generate_wms_inbound(tms_rows):
    rows = []
    inbound_tms = [r for r in tms_rows if r["Shipment Order Type"] == "Inbound"]
    for r in inbound_tms:
        actual_delivery = r["_actual_delivery"]
        # Dock-to-stock: 2–8 hours after truck arrives
        dock_to_stock_hrs = random.uniform(1.5, 7.5)
        # GRN raised ~1h after arrival
        grn_hrs = random.uniform(0.5, 2.0)
        arr_dt = actual_delivery + timedelta(hours=random.uniform(0.5, 2))
        grn_dt = arr_dt + timedelta(hours=grn_hrs)
        upd_dt = arr_dt + timedelta(hours=dock_to_stock_hrs)

        rows.append({
            "shipment_id":          r["Shipment ID"],
            "arrdte":               fmt(arr_dt),
            "last_rcpt_conf_dte":   fmt(grn_dt),
            "last_upd_dt":          fmt(upd_dt),
            "warehouse":            r["_wh"],
            "supplier_code":        random.choice(SUPPLIERS)[0],
            "sku":                  r["_sku"],
            "received_qty":         r["_qty"],
            "invoice_no":           f"INV-{random.randint(100000,999999)}",
            "shift":                random.choice(SHIFTS),
            "team":                 random.choice(TEAMS),
        })
    return rows


# ─── 3. WMS Receiving Accuracy ────────────────────────────────────────────────

def generate_wms_receiving(inbound_rows):
    rows = []
    for r in inbound_rows:
        expected = r["received_qty"]
        # ~95% accurate; occasional mismatch
        if random.random() < 0.95:
            received = expected
        else:
            mismatch = random.randint(1, max(1, int(expected * 0.05)))
            received = expected - mismatch if random.random() > 0.5 else expected + mismatch
        rows.append({
            "shipment_id": r["shipment_id"],
            "sku":         r["sku"],
            "warehouse":   r["warehouse"],
            "date":        r["arrdte"][:10],
            "expqty":      expected,
            "rcvqty":      received,
            "idnqty":      received,
            "shift":       r["shift"],
            "team":        r["team"],
        })
    return rows


# ─── 4. WMS Yard Activity ─────────────────────────────────────────────────────

def generate_wms_yard(inbound_rows):
    rows = []
    for r in inbound_rows:
        arr_dt = datetime.strptime(r["arrdte"], "%Y-%m-%d %H:%M:%S")
        trailer_id = f"TRL-{random.randint(1000,9999)}"
        # Truck enters yard
        yard_entry = arr_dt - timedelta(minutes=random.randint(20, 120))
        # Truck moves to dock
        yard_to_dock_mins = random.uniform(15, 90)
        dock_time = yard_entry + timedelta(minutes=yard_to_dock_mins)

        rows.append({
            "trndte":    fmt(yard_entry),
            "trlr_id":  trailer_id,
            "yard_loc": "YARD",
            "warehouse": r["warehouse"],
            "shift":     r["shift"],
        })
        rows.append({
            "trndte":    fmt(dock_time),
            "trlr_id":  trailer_id,
            "yard_loc": "DOCK",
            "warehouse": r["warehouse"],
            "shift":     r["shift"],
        })
    return rows


# ─── 5. WMS Outbound Orders ───────────────────────────────────────────────────

def generate_wms_outbound(tms_rows, n=1200):
    rows = []
    outbound_tms = [r for r in tms_rows if r["Shipment Order Type"] == "Outbound"]
    for r in outbound_tms[:n]:
        ordered = r["_qty"]
        # ~93% fill rate
        if random.random() < 0.93:
            shipped = ordered
            short = 0
        else:
            short = random.randint(1, max(1, int(ordered * 0.08)))
            shipped = ordered - short

        rows.append({
            "order_id":    f"ORD-{random.randint(100000,999999)}",
            "shipment_id": r["Shipment ID"],
            "sku":         r["_sku"],
            "warehouse":   r["_wh"],
            "date":        r["Date"],
            "host_ord_qty": ordered,
            "shipped_qty": shipped,
            "short_qty":   short,
            "shift":       random.choice(SHIFTS),
            "team":        random.choice(TEAMS),
            "flow":        random.choice(["B2B", "B2C", "B2B2C"]),
        })
    return rows


# ─── 6. WMS Shipment Lifecycle ────────────────────────────────────────────────

def generate_wms_lifecycle(outbound_rows):
    rows = []
    for r in outbound_rows:
        order_date = datetime.strptime(r["date"], "%Y-%m-%d")
        # Stage durations (hours)
        alloc_hrs  = random.uniform(0.5, 1.5)
        pick_hrs   = random.uniform(1.0, 2.5)
        stage_hrs  = random.uniform(1.0, 2.5)
        load_hrs   = random.uniform(2.0, 4.0)

        alloc_dt   = order_date + timedelta(hours=alloc_hrs)
        pick_dt    = alloc_dt  + timedelta(hours=pick_hrs)
        stage_dt   = pick_dt   + timedelta(hours=stage_hrs)
        load_dt    = stage_dt  + timedelta(hours=stage_hrs)
        planned_dt = order_date + timedelta(hours=random.uniform(7, 10))

        # ~88% on-time dispatch
        if random.random() < 0.88:
            dispatch_dt = planned_dt - timedelta(minutes=random.randint(0, 30))
        else:
            dispatch_dt = planned_dt + timedelta(hours=random.uniform(0.5, 6))

        rows.append({
            "order_id":            r["order_id"],
            "shipment_id":         r["shipment_id"],
            "warehouse":           r["warehouse"],
            "sku":                 r["sku"],
            "alloc_dte":           fmt(alloc_dt),
            "pick_dte":            fmt(pick_dt),
            "stage_dte":           fmt(stage_dt),
            "load_dte":            fmt(load_dt),
            "early_shpdte":        fmt(planned_dt),
            "dispatch_dte":        fmt(dispatch_dt),
            "shift":               r["shift"],
            "team":                r["team"],
        })
    return rows


# ─── 7. WMS Integration Errors ────────────────────────────────────────────────

def generate_wms_integration_errors(n=180):
    error_types = [
        "Duplicate Shipment ID",
        "Missing PO Reference",
        "Invalid SKU Code",
        "Weight Mismatch",
        "Quantity Overflow",
        "Carrier Code Not Found",
    ]
    rows = []
    for i in range(n):
        err_date = rand_date(START_DATE, END_DATE)
        rows.append({
            "error_id":    f"IE-{i+1:04d}",
            "timestamp":   fmt(err_date),
            "warehouse":   random.choice(WAREHOUSES),
            "error_type":  random.choice(error_types),
            "source":      random.choice(["ERP", "WMS", "TMS", "Carrier API"]),
            "severity":    random.choice(["Low", "Medium", "High"]),
            "resolved":    random.choice(["Yes", "Yes", "Yes", "No"]),
        })
    return rows


# ─── 8. WMS Event Errors ──────────────────────────────────────────────────────

def generate_wms_event_errors(n=120):
    event_types = [
        "Scan Failure",
        "Label Print Error",
        "Conveyor Jam",
        "WMS Timeout",
        "RF Gun Disconnected",
        "Pick Path Error",
    ]
    rows = []
    for i in range(n):
        err_date = rand_date(START_DATE, END_DATE)
        rows.append({
            "event_id":   f"EV-{i+1:04d}",
            "timestamp":  fmt(err_date),
            "warehouse":  random.choice(WAREHOUSES),
            "event_type": random.choice(event_types),
            "shift":      random.choice(SHIFTS),
            "team":       random.choice(TEAMS),
            "resolved":   random.choice(["Yes", "Yes", "No"]),
        })
    return rows


# ─── 9. Planning — Demand & Supply ────────────────────────────────────────────

def generate_planning(n_months=6):
    rows = []
    base_demand = {sku[0]: random.randint(800, 4000) for sku in SKUS}

    months = []
    d = START_DATE.replace(day=1)
    for _ in range(n_months):
        months.append(d)
        next_month = d.month % 12 + 1
        next_year  = d.year + (1 if d.month == 12 else 0)
        d = d.replace(year=next_year, month=next_month)

    for wh in WAREHOUSES:
        for sku_data in SKUS:
            sku_id, category, unit_wt, unit_vol, unit_cost = sku_data
            for month_dt in months:
                # Seasonal demand variation
                season_factor = 1.0
                if month_dt.month in [10, 11, 12]:   # festive season
                    season_factor = 1.35
                elif month_dt.month in [5, 6]:        # summer
                    season_factor = 1.15

                base = base_demand[sku_id]
                demand_plan = int(base * season_factor * random.uniform(0.9, 1.1))
                actual_demand = int(demand_plan * random.uniform(0.85, 1.10))

                # Stock on hand at start of month
                stock_on_hand = int(base * random.uniform(0.6, 1.8))
                safety_stock  = int(base * 0.25)
                reorder_point = int(base * 0.40)

                # Determine if PO was raised
                need_po = stock_on_hand < reorder_point or actual_demand > stock_on_hand
                po_qty  = int(demand_plan * random.uniform(1.0, 1.3)) if need_po else 0
                po_date = fmtd(month_dt - timedelta(days=random.randint(15, 30))) if need_po else ""
                po_expected = fmtd(month_dt + timedelta(days=random.randint(5, 15))) if need_po else ""
                po_status   = random.choice(["Delivered", "In Transit", "Pending"]) if need_po else "Not Raised"
                supplier    = random.choice(SUPPLIERS)[1]

                closing_stock = max(0, stock_on_hand + po_qty - actual_demand)
                days_of_cover = round(closing_stock / max(actual_demand / 30, 1), 1)
                stockout_risk = "High" if days_of_cover < 7 else ("Medium" if days_of_cover < 14 else "Low")

                rows.append({
                    "month":           fmtd(month_dt),
                    "warehouse":       wh,
                    "sku_id":          sku_id,
                    "category":        category,
                    "supplier":        supplier,
                    "demand_plan":     demand_plan,
                    "actual_demand":   actual_demand,
                    "demand_variance_pct": round((actual_demand - demand_plan) / demand_plan * 100, 1),
                    "stock_on_hand":   stock_on_hand,
                    "safety_stock":    safety_stock,
                    "reorder_point":   reorder_point,
                    "po_number":       f"PO-{random.randint(10000,99999)}" if need_po else "",
                    "po_qty":          po_qty,
                    "po_date":         po_date,
                    "expected_receipt_date": po_expected,
                    "po_status":       po_status,
                    "closing_stock":   closing_stock,
                    "days_of_cover":   days_of_cover,
                    "stockout_risk":   stockout_risk,
                    "unit_cost_inr":   unit_cost,
                    "inventory_value_inr": closing_stock * unit_cost,
                })
    return rows


# ─── Write CSV ────────────────────────────────────────────────────────────────

def write_csv(filename: str, rows: list[dict], exclude_keys: list[str] = None):
    if not rows:
        print(f"  [SKIP] {filename} — no rows")
        return
    out = Path(__file__).parent / filename
    fieldnames = [k for k in rows[0].keys() if not (exclude_keys and k in exclude_keys)]
    with open(out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"  [OK] {filename} — {len(rows)} rows")


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Generating TMS shipments...")
    tms_rows = generate_tms_shipments(n_inbound=600, n_outbound=900)
    write_csv("tms_shipments.csv", tms_rows,
              exclude_keys=["_wh", "_actual_delivery", "_sku", "_qty"])

    print("Generating WMS inbound receipts...")
    inbound = generate_wms_inbound(tms_rows)
    write_csv("wms_inbound_receipts.csv", inbound)

    print("Generating WMS receiving accuracy...")
    receiving = generate_wms_receiving(inbound)
    write_csv("wms_receiving_accuracy.csv", receiving)

    print("Generating WMS yard activity...")
    yard = generate_wms_yard(inbound)
    write_csv("wms_yard_activity.csv", yard)

    print("Generating WMS outbound orders...")
    outbound = generate_wms_outbound(tms_rows)
    write_csv("wms_outbound_orders.csv", outbound)

    print("Generating WMS shipment lifecycle...")
    lifecycle = generate_wms_lifecycle(outbound)
    write_csv("wms_shipment_lifecycle.csv", lifecycle)

    print("Generating WMS integration errors...")
    write_csv("wms_integration_errors.csv", generate_wms_integration_errors())

    print("Generating WMS event errors...")
    write_csv("wms_event_errors.csv", generate_wms_event_errors())

    print("Generating Planning demand/supply data...")
    write_csv("planning_demand_supply.csv", generate_planning())

    print("\nDone! All files written to:", Path(__file__).parent.resolve())
