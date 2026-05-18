import React from "react";
import { STATUS_OPTIONS } from "../../utils/constants.js";

export default function InvoiceMeta({ meta, onChange }) {
  const set = (field) => (e) => onChange(field, e.target.value);

  return (
    <div className="card">
      <div className="card__head">Invoice Details</div>
      <div className="grid4">
        <div className="field">
          <label>Invoice No.</label>
          <input type="text" value={meta.invoice_number} onChange={set("invoice_number")} />
        </div>
        <div className="field">
          <label>Invoice Date</label>
          <input type="date" value={meta.invoice_date} onChange={set("invoice_date")} />
        </div>
        <div className="field">
          <label>Due Date</label>
          <input type="date" value={meta.due_date} onChange={set("due_date")} />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={meta.status} onChange={set("status")}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="field span2">
          <label>Job Number</label>
          <input
            type="text"
            placeholder="JOB-001"
            value={meta.job_number}
            onChange={set("job_number")}
          />
        </div>
        <div className="field span2">
          <label>Place of Work</label>
          <input
            type="text"
            placeholder="Site / location"
            value={meta.place_of_work}
            onChange={set("place_of_work")}
          />
        </div>
      </div>
    </div>
  );
}
