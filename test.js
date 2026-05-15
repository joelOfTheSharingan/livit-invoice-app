import express from "express";

import handler from "./api/invoice.js";

const app = express();

app.get("/api/invoice", (req, res) => {
  return handler(req, res);
});

app.listen(5001, () => {
  console.log("🚀 Local API running:");
  console.log(
    "http://localhost:5001/api/invoice?id=5fd04783-9ab6-4b64-ace5-ff571865ceaa"
  );
});

