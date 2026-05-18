import React from "react";
import { UNITS } from "../../utils/constants.js";
import { fmt } from "../../utils/calculations.js";

export default function LineItemsTable({
  computed,
  items,
  itemOptions,
  useGST,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
}) {
  return (
    <div className="items-table-wrap">
      <table className="items-table">
        <thead>
          <tr>
            <th style={{ width: 200 }}>Description</th>
            <th style={{ width: 90 }}>HSN</th>
            <th style={{ width: 60 }} className="num">Qty</th>
            <th style={{ width: 80 }}>Unit</th>
            <th style={{ width: 90 }} className="num">Unit Price</th>
            <th style={{ width: 70 }} className="num">Disc%</th>
            <th style={{ width: 100 }} className="num">Taxable</th>
            {useGST && <th style={{ width: 80 }} className="num">CGST</th>}
            {useGST && <th style={{ width: 80 }} className="num">SGST</th>}
            <th style={{ width: 100 }} className="num">Amount</th>
            <th className="td-rm" />
          </tr>
        </thead>
        <tbody>
          {computed.map((item) => (
            <tr key={item.id}>
              <td>
                <select
                  value={itemOptions.includes(item.description) ? item.description : "__custom__"}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      onUpdateItem(item.id, "description", "");
                    } else {
                      onUpdateItem(item.id, "description", e.target.value);
                    }
                  }}
                  style={{ minWidth: 160 }}
                >
                  <option value="__custom__">Select or type…</option>
                  {itemOptions.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
                {(!itemOptions.includes(item.description) || item.description === "") && (
                  <input
                    type="text"
                    placeholder="Custom description"
                    value={item.description}
                    onChange={(e) => onUpdateItem(item.id, "description", e.target.value)}
                    style={{ marginTop: 4 }}
                  />
                )}
              </td>
              <td>
                <input
                  type="text"
                  placeholder="HSN"
                  value={item.hsn_code}
                  onChange={(e) => onUpdateItem(item.id, "hsn_code", e.target.value)}
                  style={{ width: 80 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.qty}
                  min="0"
                  onChange={(e) => onUpdateItem(item.id, "qty", e.target.value)}
                  style={{ width: 55, textAlign: "right" }}
                />
              </td>
              <td>
                <select
                  value={item.unit}
                  onChange={(e) => onUpdateItem(item.id, "unit", e.target.value)}
                  style={{ width: 75 }}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={item.unit_price}
                  min="0"
                  onChange={(e) => onUpdateItem(item.id, "unit_price", e.target.value)}
                  style={{ width: 85, textAlign: "right" }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.discount}
                  min="0"
                  max="100"
                  onChange={(e) => onUpdateItem(item.id, "discount", e.target.value)}
                  style={{ width: 60, textAlign: "right" }}
                />
              </td>
              <td className="item-amount">₹{fmt(item.taxable_value)}</td>
              {useGST && <td className="item-amount">₹{fmt(item.cgst_amount)}</td>}
              {useGST && <td className="item-amount">₹{fmt(item.sgst_amount)}</td>}
              <td className="item-amount" style={{ fontWeight: 600 }}>₹{fmt(item.amount)}</td>
              <td className="td-rm">
                <button
                  className="btn btn--danger"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={items.length === 1}
                  title="Remove row"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10, marginBottom: 16 }}>
        <button className="btn btn--sm" onClick={onAddItem}>
          + Add Row
        </button>
      </div>
    </div>
  );
}
