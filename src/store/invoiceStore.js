import { DEFAULT_CGST_RATE, DEFAULT_SGST_RATE, UNITS } from "../utils/constants.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";
import { todayISO } from "../utils/formatDate.js";

export function blankItem() {
  return {
    id: crypto.randomUUID(),
    description: "",
    hsn_code: "",
    qty: 1,
    unit: UNITS[0],
    unit_price: 0,
    discount: 0,
    cgst_rate: DEFAULT_CGST_RATE,
    sgst_rate: DEFAULT_SGST_RATE,
  };
}

export function defaultMeta() {
  return {
    invoice_number: generateInvoiceNumber(),
    invoice_date: todayISO(),
    due_date: "",
    job_number: "",
    place_of_work: "",
    notes: "",
    status: "draft",
  };
}

export function defaultClient() {
  return {
    name: "",
    gst_no: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    place_of_supply: "",
    bank_name: "",
    account_name: "",
    account_no: "",
    ifsc: "",
    branch: "",
  };
}
