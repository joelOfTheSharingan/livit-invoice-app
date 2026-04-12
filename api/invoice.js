import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { createClient } from "@supabase/supabase-js";

/* =========================
   SUPABASE CLIENT
========================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* =========================
   VERCEL SERVERLESS FUNCTION
========================= */
export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("Missing invoice ID");
    }

    /* =========================
       1. FETCH DATA
    ========================= */
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

    if (invError || !invoice) {
      return res.status(404).send("Invoice not found");
    }

    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    /* =========================
       2. BUILD ROWS
    ========================= */
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
          <td class="right-text">${Number(item.unit_price || 0).toFixed(2)}</td>
          <td class="right-text">${Number(item.gross_value || 0).toFixed(2)}</td>
          <td class="right-text">${item.discount || 0}%</td>
          <td colspan="2" class="right-text">${Number(item.taxable_value || 0).toFixed(2)}</td>
          <td class="right-text">${Number(item.cgst_amount || 0).toFixed(2)}</td>
          <td class="right-text">${Number(item.sgst_amount || 0).toFixed(2)}</td>
          <td class="right-text">${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        </tr>
        `;
      })
      .join("");

    /* =========================
       3. HTML TEMPLATE
    ========================= */
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
.invoice-container { width: 100%; border: 1px solid #000; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
td, th { border: 1px solid #000; padding: 6px; font-size: 11px; }
.header-dark { background: #2c3e50; color: #fff; text-align: center; font-weight: bold; }
.header-sub { background: #e0e6ed; text-align: center; font-weight: bold; }
.center-text { text-align: center; }
.right-text { text-align: right; }
.gray-bar { background: #bdc3c7; height: 18px; }
.total-row { background: #bdc3c7; font-weight: bold; }
</style>
</head>
<body>
<div class="invoice-container">
<table>

<tr><td colspan="12" class="header-dark">PROFORMA INVOICE</td></tr>
<tr><td colspan="12" class="header-sub">LIVIT INTERIORS PRIVATE LIMITED</td></tr>

<tr>
<td colspan="12" class="center-text">
4144 A. No.1 Villa, Kochi<br>
PIN Code: 682017 | GSTIN: 32AAFCL5089C1ZO
</td>
</tr>

<tr>
<td colspan="6">
<strong>${invoice.clients?.name || ""}</strong><br>
${invoice.clients?.address || ""}
</td>
<td colspan="3">Invoice: ${invoice.invoice_number}</td>
<td colspan="3">Date: ${invoice.invoice_date || ""}</td>
</tr>

<tr class="header-sub">
<td>Description</td>
<td>HSN</td>
<td>QTY</td>
<td>Unit</td>
<td>Price</td>
<td>Gross</td>
<td>Disc</td>
<td colspan="2">Taxable</td>
<td>CGST</td>
<td>SGST</td>
<td>Total</td>
</tr>

${rows}

<tr class="gray-bar"><td colspan="12"></td></tr>

<tr class="total-row">
<td colspan="11">${invoice.amount_in_words || ""}</td>
<td>₹ ${Number(invoice.grand_total || 0).toFixed(2)}</td>
</tr>

</table>
</div>
</body>
</html>
`;

    /* =========================
       4. PDF GENERATION (FIXED)
    ========================= */

    chromium.setGraphicsMode = false;

    const browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await browser.close();

    /* =========================
       5. RESPONSE
    ========================= */
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Invoice_${invoice.invoice_number}.pdf`
    );

    res.status(200).send(pdf);
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).send("PDF generation failed");
  }
}