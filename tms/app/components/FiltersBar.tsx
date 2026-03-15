"use client";

import { useState } from "react";
import { FilterState, useFilters } from "../stores";
import { ShipmentRecord } from "../stores";

type Props = {
  shipments: ShipmentRecord[];
};

export default function FiltersBar({ shipments }: Props) {
  const { filters, setFilters } = useFilters();
  const [originOpen, setOriginOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const handleClear = () => {
    setFilters({
      startDate: "",
      endDate: "",
      carrier: "All",
      mode: "All",
      productType: "All",
      originRegion: "All",
      originCountry: "All",
      originState: "All",
      originCity: "All",
      destinationRegion: "All",
      destinationCountry: "All",
      destinationState: "All",
      destinationCity: "All",
      route: "All",
      status: "All",
      orderType: "All"
    });
  };
  const applyFilters = (items: ShipmentRecord[], next: Partial<FilterState>) =>
    items.filter((record) => {
      const merged = { ...filters, ...next };
      if (merged.carrier !== "All" && record.carrierName !== merged.carrier) {
        return false;
      }
      if (merged.mode !== "All" && record.modeOfTransport !== merged.mode) {
        return false;
      }
      if (
        merged.productType !== "All" &&
        record.productType !== merged.productType
      ) {
        return false;
      }
      if (
        merged.originRegion !== "All" &&
        record.originRegion !== merged.originRegion
      ) {
        return false;
      }
      if (
        merged.originCountry !== "All" &&
        record.originCountry !== merged.originCountry
      ) {
        return false;
      }
      if (
        merged.originState !== "All" &&
        record.originState !== merged.originState
      ) {
        return false;
      }
      if (merged.originCity !== "All" && record.originCity !== merged.originCity) {
        return false;
      }
      if (
        merged.destinationRegion !== "All" &&
        record.destinationRegion !== merged.destinationRegion
      ) {
        return false;
      }
      if (
        merged.destinationCountry !== "All" &&
        record.destinationCountry !== merged.destinationCountry
      ) {
        return false;
      }
      if (
        merged.destinationState !== "All" &&
        record.destinationState !== merged.destinationState
      ) {
        return false;
      }
      if (
        merged.destinationCity !== "All" &&
        record.destinationCity !== merged.destinationCity
      ) {
        return false;
      }
      if (merged.route !== "All" && record.route !== merged.route) {
        return false;
      }
      if (merged.status !== "All" && record.onTimeStatus !== merged.status) {
        return false;
      }
      if (
        merged.orderType !== "All" &&
        record.shipmentOrderType !== merged.orderType
      ) {
        return false;
      }
      if (merged.startDate) {
        if (record.date < merged.startDate) {
          return false;
        }
      }
      if (merged.endDate) {
        if (record.date > merged.endDate) {
          return false;
        }
      }
      return true;
    });

  const carriers = Array.from(
    new Set(
      applyFilters(shipments, { carrier: "All" }).map(
        (record) => record.carrierName
      )
    )
  );
  const modes = Array.from(
    new Set(
      applyFilters(shipments, { mode: "All" }).map(
        (record) => record.modeOfTransport
      )
    )
  );
  const products = Array.from(
    new Set(
      applyFilters(shipments, { productType: "All" }).map(
        (record) => record.productType
      )
    )
  );
  const originRegions = Array.from(
    new Set(
      applyFilters(shipments, { originRegion: "All" }).map(
        (record) => record.originRegion
      )
    )
  );
  const originCountries = Array.from(
    new Set(
      applyFilters(shipments, { originCountry: "All" }).map(
        (record) => record.originCountry
      )
    )
  );
  const originStates = Array.from(
    new Set(
      applyFilters(shipments, { originState: "All" }).map(
        (record) => record.originState
      )
    )
  );
  const originCities = Array.from(
    new Set(
      applyFilters(shipments, { originCity: "All" }).map(
        (record) => record.originCity
      )
    )
  );
  const destinationRegions = Array.from(
    new Set(
      applyFilters(shipments, { destinationRegion: "All" }).map(
        (record) => record.destinationRegion
      )
    )
  );
  const destinationCountries = Array.from(
    new Set(
      applyFilters(shipments, { destinationCountry: "All" }).map(
        (record) => record.destinationCountry
      )
    )
  );
  const destinationStates = Array.from(
    new Set(
      applyFilters(shipments, { destinationState: "All" }).map(
        (record) => record.destinationState
      )
    )
  );
  const destinationCities = Array.from(
    new Set(
      applyFilters(shipments, { destinationCity: "All" }).map(
        (record) => record.destinationCity
      )
    )
  );
  const routes = Array.from(
    new Set(
      applyFilters(shipments, { route: "All" }).map(
        (record) => record.route
      )
    )
  );
  const statuses = Array.from(
    new Set(
      applyFilters(shipments, { status: "All" }).map(
        (record) => record.onTimeStatus
      )
    )
  );
  const orderTypes = Array.from(
    new Set(
      applyFilters(shipments, { orderType: "All" }).map(
        (record) => record.shipmentOrderType
      )
    )
  );

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="filters-header">
        <div className="kpi-label">Global Filters</div>
        <button className="ghost" type="button" onClick={handleClear}>
          Clear Filters
        </button>
      </div>
      <div className="filters" style={{ marginTop: 12 }}>
        <div>
          <label>Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) =>
              setFilters({ ...filters, startDate: event.target.value })
            }
          />
        </div>
        <div>
          <label>End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) =>
              setFilters({ ...filters, endDate: event.target.value })
            }
          />
        </div>
        <div>
          <label>Carrier</label>
          <select
            value={filters.carrier}
            onChange={(event) =>
              setFilters({ ...filters, carrier: event.target.value })
            }
          >
            <option value="All">All</option>
            {carriers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Mode</label>
          <select
            value={filters.mode}
            onChange={(event) =>
              setFilters({ ...filters, mode: event.target.value })
            }
          >
            <option value="All">All</option>
            {modes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Product</label>
          <select
            value={filters.productType}
            onChange={(event) =>
              setFilters({ ...filters, productType: event.target.value })
            }
          >
            <option value="All">All</option>
            {products.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-popover">
          <label>Origin</label>
          <button
            type="button"
            className="secondary"
            onClick={() => setOriginOpen((open) => !open)}
          >
            {originOpen ? "Close" : "Select Origin"}
          </button>
          {originOpen ? (
            <div className="popover-panel">
              <label>Origin Region</label>
              <select
                value={filters.originRegion}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    originRegion: event.target.value,
                    originCountry: "All",
                    originState: "All",
                    originCity: "All"
                  })
                }
              >
                <option value="All">All</option>
                {originRegions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <label>Origin Country</label>
              <select
                value={filters.originCountry}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    originCountry: event.target.value,
                    originState: "All",
                    originCity: "All"
                  })
                }
              >
                <option value="All">All</option>
                {originCountries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <label>Origin State</label>
              <select
                value={filters.originState}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    originState: event.target.value,
                    originCity: "All"
                  })
                }
              >
                <option value="All">All</option>
                {originStates.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <label>Origin City</label>
              <select
                value={filters.originCity}
                onChange={(event) =>
                  setFilters({ ...filters, originCity: event.target.value })
                }
              >
                <option value="All">All</option>
                {originCities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <div className="filter-popover">
          <label>Destination</label>
          <button
            type="button"
            className="secondary"
            onClick={() => setDestinationOpen((open) => !open)}
          >
            {destinationOpen ? "Close" : "Select Destination"}
          </button>
          {destinationOpen ? (
            <div className="popover-panel">
              <label>Destination Region</label>
              <select
                value={filters.destinationRegion}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    destinationRegion: event.target.value,
                    destinationCountry: "All",
                    destinationState: "All",
                    destinationCity: "All"
                  })
                }
              >
                <option value="All">All</option>
                {destinationRegions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <label>Destination Country</label>
              <select
                value={filters.destinationCountry}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    destinationCountry: event.target.value,
                    destinationState: "All",
                    destinationCity: "All"
                  })
                }
              >
                <option value="All">All</option>
                {destinationCountries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <label>Destination State</label>
              <select
                value={filters.destinationState}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    destinationState: event.target.value,
                    destinationCity: "All"
                  })
                }
              >
                <option value="All">All</option>
                {destinationStates.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <label>Destination City</label>
              <select
                value={filters.destinationCity}
                onChange={(event) =>
                  setFilters({ ...filters, destinationCity: event.target.value })
                }
              >
                <option value="All">All</option>
                {destinationCities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <div>
          <label>Route</label>
          <select
            value={filters.route}
            onChange={(event) =>
              setFilters({ ...filters, route: event.target.value })
            }
          >
            <option value="All">All</option>
            {routes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value })
            }
          >
            <option value="All">All</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Order Type</label>
          <select
            value={filters.orderType}
            onChange={(event) =>
              setFilters({ ...filters, orderType: event.target.value })
            }
          >
            <option value="All">All</option>
            {orderTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
