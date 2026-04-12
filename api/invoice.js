import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("Missing invoice ID");
    }

    // ✅ Fetch Invoice
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
      console.error(invError);
      return res.status(404).send("Invoice not found");
    }

    // ✅ Fetch Items
    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    // ✅ Build Rows
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

    // ✅ HTML TEMPLATE (YOUR DESIGN)
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
4144 Aikkarakunnel, Kaloor, Kochi<br>
PIN: 682017 | GSTIN: 32AAFCL5089C1ZO
</td>
</tr>

<tr>
<td colspan="6" rowspan="2">
Bill To:<br>
<b>${invoice.clients?.name || ""}</b><br>
${invoice.clients?.address || ""}<br>
${invoice.clients?.state || ""} ${invoice.clients?.place_of_supply || ""}<br>
${invoice.clients?.gst_no || ""}
</td>

<td colspan="2">Job No</td>
<td colspan="2">${invoice.job_number || ""}</td>
<td>Invoice</td>
<td>Date</td>
</tr>

<tr>
<td colspan="2">Work Place</td>
<td colspan="2">${invoice.place_of_work || ""}</td>
<td>${invoice.invoice_number || ""}</td>
<td>${invoice.invoice_date || ""}</td>
</tr>

<tr class="header-sub">
<td>Description</td>
<td>HSN</td>
<td>Qty</td>
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

<tr>
<td colspan="8"></td>
<td colspan="3">Taxable</td>
<td class="right-text">${Number(invoice.taxable_amount || 0).toFixed(2)}</td>
</tr>

<tr>
<td colspan="8"></td>
<td colspan="3">CGST</td>
<td class="right-text">${Number(invoice.cgst_total || 0).toFixed(2)}</td>
</tr>

<tr>
<td colspan="8"></td>
<td colspan="3">SGST</td>
<td class="right-text">${Number(invoice.sgst_total || 0).toFixed(2)}</td>
</tr>

<tr class="total-row">
<td colspan="11">${invoice.amount_in_words || ""}</td>
<td class="right-text">₹ ${Number(invoice.grand_total || 0).toFixed(2)}</td>
</tr>

<tr>
<td colspan="8">
Declaration:<br>
We certify that details are correct.
</td>
<td colspan="4" class="center-text">
For Livit Interiors<br><br><br>
Authorised Signatory
</td>
</tr>

</table>
</div>
</body>
</html>
`;

    // ✅ Launch Chromium (FIXED)
    const browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "load" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // ✅ RESPONSE FIX (VERY IMPORTANT)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=invoice-${invoice.invoice_number}.pdf`
    );

    return res.end(pdf); // 👈 IMPORTANT (NOT res.send)

  } catch (err) {
    console.error("PDF ERROR:", err);
    return res.status(500).send("PDF generation failed: " + err.message);
  }
}