import { PDF_BASE_URL, IS_LOCAL } from "../utils/constants.js";

export function getPdfUrl(invoiceId) {
  return `${PDF_BASE_URL}?id=${invoiceId}`;
    
}
