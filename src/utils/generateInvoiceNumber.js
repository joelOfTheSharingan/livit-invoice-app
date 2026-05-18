export function generateInvoiceNumber(prefix = "INV") {
  return `${prefix}-${Date.now()}`;
}
