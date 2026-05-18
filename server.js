import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import invoiceHandler from "./api/invoice.js";
import chatHandler from "./api/chat.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/api/invoice", (req, res) => {
  return invoiceHandler(req, res);
});

app.post("/api/chat", (req, res) => {
  console.log("🔥 CHAT ROUTE HIT");
  return chatHandler(req, res);
});

app.listen(5001, () => {
  console.log("🚀 Local API running:");
  console.log("Invoice:");
  console.log(
    "http://localhost:5001/api/invoice?id=YOUR_ID"
  );
  console.log("Chat:");
  console.log(
    "http://localhost:5001/api/chat"
  );

  console.log(
    "OPENROUTER_API_KEY exists:",
    !!process.env.OPENROUTER_API_KEY
  );
});

