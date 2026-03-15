# KPI Formulas and Data Mapping

This document lists each KPI, the columns used, and the formula/logic applied in the product.

---

## Data Columns Used

- Shipment ID
- Load ID
- Date
- Estimated Delivery Date
- Actual_Delivery_Date
- Delays
- On-Time / Delayed / In-Transit
- Shipment Cost (USD)
- Distance_km
- Total_Weight_in_Shipment_kg
- Transit Time (Days)
- Shipment Planned
- Equipment Weight Capacity (KG)
- Equipment_VolumeCapacity_m3
- Total Volume in Shipment_m3
- Tendered Status
- Carrier Name
- Mode of Transport
- Route (derived as Origin City -> Destination City)

---

## KPI Definitions

### On-Time Rate (%)
**Columns:** On-Time / Delayed / In-Transit, Delays, Estimated Delivery Date, Actual_Delivery_Date  
**Logic:**  
- status = normalized onTimeStatus (lowercased)  
- isDelayed = status contains "delayed" OR Delays > 0 OR Actual_Delivery_Date > Estimated Delivery Date  
- isInTransit = status contains "in-transit"  
- isOnTime = status contains "on-time" OR (not delayed and not in-transit)  
**Formula:**  
`onTimeRate = (onTimeCount / totalShipments) * 100`

### Delay Rate (%)
**Columns:** On-Time / Delayed / In-Transit, Delays, Estimated Delivery Date, Actual_Delivery_Date  
**Formula:**  
`delayRate = (delayedCount / totalShipments) * 100`

### Average Transit Time (days)
**Columns:** Transit Time (Days), Date, Actual_Delivery_Date  
**Logic:**  
- If Transit Time (Days) is present, use it  
- Else use difference between Actual_Delivery_Date and Date  
**Formula:**  
`averageTransitTime = totalTransitDays / totalShipments`

### Transit Time Variance (days)
**Columns:** Transit Time (Days), Date, Actual_Delivery_Date  
**Formula:**  
`variance = (sum(transitDays^2) / totalShipments) - (avgTransitTime^2)`

### Average Delay Days
**Columns:** Delays  
**Formula:**  
`averageDelayDays = sum(max(Delays, 0)) / totalShipments`

### Cost per Shipment (USD)
**Columns:** Shipment Cost (USD)  
**Formula:**  
`costPerShipment = totalCost / totalShipments`

### Cost per KM (USD)
**Columns:** Shipment Cost (USD), Distance_km  
**Formula:**  
`costPerKm = totalCost / totalDistanceKm`

### Cost per Mile (USD)
**Columns:** Shipment Cost (USD), Distance_km  
**Formula:**  
`costPerMile = totalCost / (totalDistanceKm * 0.621371)`

### Cost per KG (USD)
**Columns:** Shipment Cost (USD), Total_Weight_in_Shipment_kg  
**Formula:**  
`costPerKg = totalCost / totalWeightKg`

### Weight Utilization (%)
**Columns:** Total_Weight_in_Shipment_kg, Equipment Weight Capacity (KG)  
**Formula:**  
`weightUtilization = avg( (shipmentWeight / equipmentWeightCapacity) * 100 )`
Only computed when capacity > 0.

### Volume Utilization (%)
**Columns:** Total Volume in Shipment_m3, Equipment_VolumeCapacity_m3  
**Formula:**  
`volumeUtilization = avg( (shipmentVolume / equipmentVolumeCapacity) * 100 )`
Only computed when capacity > 0.

### Carrier On-Time Rate (%)
**Columns:** Carrier Name, On-Time / Delayed / In-Transit  
**Logic:**  
- For each carrier, compute on-time rate  
- Final KPI is average of carrier-level on-time rates  
**Formula:**  
`carrierOnTimeRate = avg( onTimeRatePerCarrier )`

### Tender Acceptance Rate (%)
**Columns:** Tendered Status  
**Logic:**  
- accepted = Tendered Status == "accepted" (case-insensitive)  
**Formula:**  
`tenderAcceptanceRate = (acceptedCount / totalShipments) * 100`

### CO2 Total (kg)
**Columns:** Distance_km, Total_Weight_in_Shipment_kg, Mode of Transport  
**Logic:**  
- tonKm = (weightKg / 1000) * distanceKm  
- emissionFactor (kg CO2 per ton-km):  
  - Road = 0.12  
  - Rail = 0.02  
  - Air = 0.60  
  - Ocean/Sea/Ship = 0.01  
**Formula:**  
`totalCo2Kg = sum(tonKm * emissionFactor)`

### CO2 per Shipment (kg)
**Formula:**  
`co2PerShipment = totalCo2Kg / totalShipments`

### CO2 per Ton-KM (kg)
**Formula:**  
`co2PerTonKm = totalCo2Kg / totalTonKm`

---

## Notes
- Dates are parsed from Date / Estimated / Actual columns.
- If Date values are empty (e.g., "00:00.0"), a fallback date is derived from Month + Year in upload parsing.
- Route is derived as `Origin City -> Destination City` at upload time.
