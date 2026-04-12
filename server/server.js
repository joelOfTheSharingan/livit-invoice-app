import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   SUPABASE CLIENT
========================= */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("Server working ✅");
});

/* =========================
   INVOICE API (JSON + PDF)
========================= */

app.get("/invoice/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. GET INVOICE + DYNAMIC CLIENT DATA
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          name,
          address,
          gst_no,
          bank_name,
          account_name,
          account_no,
          ifsc,
          branch,
          state,
          place_of_supply
        )
      `)
      .eq("id", id)
      .single();

    if (invError || !invoice) return res.status(404).send("Invoice not found");

    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    // 2. BUILD ITEM ROWS (Adjusted alignment & spacing)
    const rows = (items || [])
      .map((item) => {
        const rowTotal = 
          Number(item.taxable_value || 0) + 
          Number(item.cgst_amount || 0) + 
          Number(item.sgst_amount || 0);

        return `
        <tr>
          <td style="text-align: left;">${item.description || ""}</td>
          <td class="center-text">${item.hsn_code || ""}</td>
          <td class="center-text">${item.qty || ""}</td>
          <td class="center-text">${item.unit || ""}</td>
          <td class="right-text">${Number(item.unit_price).toFixed(2)}</td>
          <td class="right-text">${Number(item.gross_value).toFixed(2)}</td>
          <td class="right-text">${item.discount || 0}%</td>
          <td colspan="2" class="right-text">${Number(item.taxable_value).toFixed(2)}</td>
          <td class="right-text">${Number(item.cgst_amount).toFixed(2)}</td>
          <td class="right-text">${Number(item.sgst_amount).toFixed(2)}</td>
          <td class="right-text">${rowTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        </tr>
        `;
      })
      .join("");

    // 3. HTML TEMPLATE (Dynamic Bank Cells & Layout Tweak)
    // =========================
    // 4. HTML TEMPLATE (With Signature Lines)
    // =========================
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; }
        .invoice-container { width: 850px; margin: auto; border: 1px solid #000; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        td, th { border: 1px solid #000; padding: 6px; font-size: 11px; word-wrap: break-word; }
        .header-dark { background: #2c3e50; color: #fff; text-align: center; font-weight: bold; font-size: 14px; }
        .header-sub { background: #e0e6ed; text-align: center; font-weight: bold; font-size: 12px; }
        .center-text { text-align: center; }
        .right-text { text-align: right; }
        .gray-bar { background: #bdc3c7; height: 18px; }
        .total-row { background: #bdc3c7; font-weight: bold; }
        .declaration-box { font-size: 10px; vertical-align: top; padding: 10px; border-bottom: 1px solid #000; }
        .signatory-box { text-align: center; vertical-align: top; padding-top: 5px; height: 60px; }
        .signature-line { border-top: 1px solid #000; font-weight: bold; padding-top: 5px; }
    </style>
</head>
<body>

<div class="invoice-container">
    <table>
        <tr><td colspan="12" class="header-dark">PROFORMA INVOICE</td></tr>
        <tr><td colspan="12" class="header-sub">LIVIT INTERIORS PRIVATE LIMITED</td></tr>
        <tr>
            <td colspan="12" class="center-text">
                4144 A. No.1 Villa, Aikkarakunnel, 4 Seasons, Fr Manuel Road, Kaloor, Kochi<br>
                PIN Code: 682017
            </td>
        </tr>
        <tr><td colspan="12" class="center-text">GSTIN: 32AAFCL5089C1ZO</td></tr>

        <tr>
            <td colspan="6">Job No: ${invoice.job_number || "N/A"}</td>
            <td colspan="2" class="center-text">Place of work</td>
            <td colspan="2"></td>
            <td>Invoice no.</td>
            <td>Date</td>
        </tr>

        <tr>
            <td colspan="6" rowspan="2" style="vertical-align: top;">
                Bill to,<br>
                <strong>${invoice.clients?.name || "N/A"}</strong><br>
                ${invoice.clients?.address || ""}<br>
                ${invoice.clients?.state ? invoice.clients.state + ", " : ""}${invoice.clients?.place_of_supply || ""}<br>
                ${invoice.clients?.gst_no ? "GST: " + invoice.clients.gst_no : ""}
            </td>
            <td colspan="2" rowspan="2" class="center-text">${invoice.place_of_work || ""}</td>
            <td colspan="2" rowspan="2"></td>
            <td class="center-text">${invoice.invoice_number}</td>
            <td class="center-text">${invoice.invoice_date || ""}</td>
        </tr>
        <tr><td></td><td></td></tr>

        <tr class="header-sub">
            <td style="width:35%">Description</td>
            <td style="width:8%">HSN</td>
            <td style="width:6%">QTY</td>
            <td style="width:6%">Unit</td>
            <td style="width:9%">Price</td>
            <td style="width:9%">Gross</td>
            <td style="width:6%">Disc</td>
            <td colspan="2" style="width:11%">Taxable</td>
            <td style="width:7%">CGST</td>
            <td style="width:7%">SGST</td>
            <td style="width:10%">Total</td>
        </tr>

        ${rows}

        <tr class="gray-bar"><td colspan="12"></td></tr>

        <tr>
            <td colspan="3">Bank name:</td>
            <td colspan="5"> ${invoice.clients?.bank_name || "N/A"}</td>
            <td colspan="3">TAXABLE AMOUNT</td>
            <td class="right-text">${Number(invoice.taxable_amount || 0).toFixed(2)}</td>
        </tr>
        <tr>
            <td colspan="3">Account name:</td>
            <td colspan="5"> ${invoice.clients?.account_name || "N/A"}</td>
            <td colspan="3">Add CGST</td>
            <td class="right-text">${Number(invoice.cgst_total || 0).toFixed(2)}</td>
        </tr>
        <tr>
            <td colspan="3">Account no:</td>
            <td colspan="5">${invoice.clients?.account_no || "N/A"}</td>
            <td colspan="3">Add SGST</td>
            <td class="right-text">${Number(invoice.sgst_total || 0).toFixed(2)}</td>
        </tr>
        <tr>
            <td colspan="3">IFSC:</td>
            <td colspan="5"> ${invoice.clients?.ifsc || "N/A"}</td>
            <td colspan="3">Round Off</td>
            <td class="right-text">${Number(invoice.round_off || 0).toFixed(2)}</td>
        </tr>
        <tr>
            <td colspan="3">Branch:</td>
            <td colspan="5"> ${invoice.clients?.branch || "N/A"}</td>
            <td colspan="3"></td>
            <td></td>
        </tr>

        <tr class="total-row">
            <td colspan="11" class="center-text">
                ${invoice.amount_in_words || ""}
            </td>
            <td class="right-text">
                ₹ ${Number(invoice.grand_total || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </td>
        </tr>

        <tr>
  <!-- LEFT: Declaration -->
  <td colspan="8" style="vertical-align: top; padding: 10px; font-size: 10px; border-bottom: 1px solid #000;">
    <strong>Declaration:</strong><br>
    WE CERTIFY THAT ALL THE PARTICULARS SHOWN IN THE ABOVE INVOICE ARE TRUE AND CORRECT
  </td>
   

  <!-- RIGHT: Signature Block -->
  <td colspan="4" style="padding: 0;">
    <table style="width:100%; border-collapse: collapse; height:100%;">
      <tr>
  <td style="text-align: center; vertical-align: top; height: 10px; border-bottom: 1px solid #000;">
    For Livit Interiors
  </td>
</tr>
<tr>
  <td style="text-align: center; vertical-align: bottom; height: 70px;">
    Authorised Signatory
  </td>
</tr>
    </table>
  </td>
</tr>
    </table>
</div>

</body>
</html>
`;
// ... rest of the PDF generation and server start logic

    // =========================
    // 5. PDF GENERATION
    // =========================
    const browser = await puppeteer.launch({ 
        args: ["--no-sandbox", "--disable-setuid-sandbox"] 
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Invoice_${invoice.invoice_number}.pdf`
    );

    res.send(pdf);

  } catch (err) {
    console.error("PDF Generation Error:", err);
    res.status(500).send("Error generating invoice PDF");
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});