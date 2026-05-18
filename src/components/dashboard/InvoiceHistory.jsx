import React, { useState } from "react";
import { fmt } from "../../utils/calculations.js";
import { getPdfUrl } from "../../services/pdfService.js";
import { STATUS_OPTIONS } from "../../utils/constants.js";
import EmptyState from "../common/EmptyState.jsx";

export default function InvoiceHistory({ invoices, onNewInvoice }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.clients?.name?.toLowerCase().includes(q) ||
      inv.job_number?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="card">
      <div className="card__head">
        Invoice History
        <span className="card__head-tag">{filtered.length} records</span>
      </div>

      <div className="inv-filters">
        <div className="field inv-search">
          <input
            type="text"
            placeholder="Search by invoice no, client, job…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field" style={{ width: 160 }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No invoices found" />
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice No.</th>
              <th>Client</th>
              <th>Job No.</th>
              <th>Status</th>
              <th className="num">Total</th>
              <th className="num">PDF</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.invoice_date}</td>
                <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                <td>{inv.clients?.name || "Unknown"}</td>
                <td>{inv.job_number || "—"}</td>
                <td>
                  <span className={`status-badge status--${inv.status}`}>{inv.status}</span>
                </td>
                <td className="num" style={{ fontWeight: 600 }}>
                  ₹{fmt(inv.grand_total)}
                </td>
                <td className="num">
                  <a
                    href={getPdfUrl(inv.id || inv.invoice_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--sm"
                  >
                    📄 PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
