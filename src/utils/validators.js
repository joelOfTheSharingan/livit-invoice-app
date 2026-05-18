export function validateInvoiceItems(items) {
  return items.every((it) => it.description?.trim());
}

export function validateClient(client, isNewClient) {
  if (!isNewClient) return true;
  return client.name?.trim().length > 0;
}

export function validateGST(gstNo) {
  if (!gstNo) return true; // optional
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNo);
}
