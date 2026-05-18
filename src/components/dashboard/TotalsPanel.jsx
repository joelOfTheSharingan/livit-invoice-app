import React from "react";
import { fmt } from "../../utils/calculations.js";
import { numberToWords } from "../../utils/numberToWords.js";

export default function TotalsPanel({
  computed,
  totals,
  useGST,
  roundOff,
  onToggleRoundOff,
  onChangeCGST,
  onChangeSGST,
}) {
  const { discountTotal, taxableTotal, cgstTotal, sgstTotal, roundOffAmt, grandTotal } = totals;
  const cgstRate = computed[0]?.cgst_rate ?? 9;
  const sgstRate = computed[0]?.sgst_rate ?? 9;

  return (
    <>
      <div className="totals-panel">
        <div className="totals-box">
          {discountTotal > 0 && (
            <div className="totals-row">
              <span className="totals-label">Discount</span>
              <span className="totals-value" style={{ color: "var(--accent)" }}>
                − ₹{fmt(discountTotal)}
              </span>
            </div>
          )}
          <div className="totals-row">
            <span className="totals-label">Taxable Amount</span>
            <span className="totals-value">₹{fmt(taxableTotal)}</span>
          </div>

          {useGST && (
            <>
              <div className="totals-row">
                <span className="totals-label">
                  CGST %
                  <input
                    type="number"
                    value={cgstRate}
                    min="0"
                    max="14"
                    style={{ width: 60, marginLeft: 8 }}
                    onChange={(e) => onChangeCGST(Number(e.target.value))}
                  />
                </span>
                <span className="totals-value">₹{fmt(cgstTotal)}</span>
              </div>
              <div className="totals-row">
                <span className="totals-label">
                  SGST %
                  <input
                    type="number"
                    value={sgstRate}
                    min="0"
                    max="14"
                    style={{ width: 60, marginLeft: 8 }}
                    onChange={(e) => onChangeSGST(Number(e.target.value))}
                  />
                </span>
                <span className="totals-value">₹{fmt(sgstTotal)}</span>
              </div>
              <div className="totals-row">
                <span className="totals-label">Total GST</span>
                <span className="totals-value">{cgstRate + sgstRate}%</span>
              </div>
            </>
          )}

          {roundOff ? (
            <div className="totals-row">
              <span className="totals-label">
                Round Off &nbsp;
                <button className="btn--link" onClick={() => onToggleRoundOff(false)}>
                  off
                </button>
              </span>
              <span className="totals-value">
                {roundOffAmt >= 0 ? "+" : ""}₹{fmt(roundOffAmt)}
              </span>
            </div>
          ) : (
            <div className="totals-row">
              <span className="totals-label">
                <button className="btn--link" onClick={() => onToggleRoundOff(true)}>
                  Enable round-off
                </button>
              </span>
            </div>
          )}

          <div className="totals-row grand">
            <span className="totals-label">Grand Total</span>
            <span className="totals-value">₹{fmt(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="words-box">{numberToWords(grandTotal)}</div>
    </>
  );
}
