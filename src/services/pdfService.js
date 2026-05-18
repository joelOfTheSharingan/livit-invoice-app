import { PDF_BASE_URL, IS_LOCAL } from "../utils/constants.js";

export function getPdfUrl(invoiceId) {
  return IS_LOCAL
    ? `${PDF_BASE_URL}?id=${invoiceId}`
    : `${PDF_BASE_URL}/${invoiceId}`;
    
}
