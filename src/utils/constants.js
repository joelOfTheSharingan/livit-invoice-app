export const UNITS = ["Nos", "m", "kg", "L", "Sqm", "Sqft", "Rmt", "Set", "Lot", "Job", "Hrs"];

export const STATUS_OPTIONS = ["draft", "sent", "paid", "overdue"];

export const DEFAULT_CGST_RATE = 9;
export const DEFAULT_SGST_RATE = 9;

export const LIVIT_SCHEMA = "livit";

export const IS_LOCAL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const PDF_BASE_URL = IS_LOCAL
  ? "http://localhost:5001/api/invoice"
  : "https://livit-invoice-app.vercel.app/api/invoice";

export const HOME_URL = IS_LOCAL
  ? "http://localhost:3000/home/login"
  : "https://joelmg.in/login";
