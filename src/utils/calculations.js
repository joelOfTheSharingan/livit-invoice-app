export function calcItem(item) {
  const gross = Number(item.qty) * Number(item.unit_price);
  const disc = (gross * Number(item.discount || 0)) / 100;
  const taxable = gross - disc;
  const cgst_amount = (taxable * Number(item.cgst_rate || 0)) / 100;
  const sgst_amount = (taxable * Number(item.sgst_rate || 0)) / 100;
  const amount = taxable + cgst_amount + sgst_amount;
  return { gross_value: gross, discount_amt: disc, taxable_value: taxable, cgst_amount, sgst_amount, amount };
}

export function calcTotals(computedItems, useGST, roundOff) {
  const taxableTotal = computedItems.reduce((s, it) => s + it.taxable_value, 0);
  const discountTotal = computedItems.reduce((s, it) => s + it.discount_amt, 0);
  const cgstTotal = useGST ? computedItems.reduce((s, it) => s + it.cgst_amount, 0) : 0;
  const sgstTotal = useGST ? computedItems.reduce((s, it) => s + it.sgst_amount, 0) : 0;
  const grandRaw = taxableTotal + cgstTotal + sgstTotal;
  const roundOffAmt = roundOff ? Math.round(grandRaw) - grandRaw : 0;
  const grandTotal = grandRaw + roundOffAmt;
  return { taxableTotal, discountTotal, cgstTotal, sgstTotal, grandRaw, roundOffAmt, grandTotal };
}

export function fmt(v) {
  return Number(v || 0).toFixed(2);
}
