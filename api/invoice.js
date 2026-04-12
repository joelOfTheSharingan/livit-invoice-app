import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    console.log("START");

    const { id } = req.query;

    if (!id) {
      return res.status(400).send("Missing invoice ID");
    }

    console.log("ID:", id);

    // =========================
    // FETCH INVOICE
    // =========================
    const { data: invoice, error } = await supabase
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

    if (error || !invoice) {
      console.log("INVOICE ERROR:", error);
      return res.status(404).send("Invoice not found");
    }

    // =========================
    // FETCH ITEMS
    // =========================
    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    console.log("ITEMS:", items?.length);

    // =========================
    // BUILD ROWS (SAFE)
    // =========================
    const rows = (items || [])
      .map((item) => {
        const qty = Number(item.qty || 0);
        const price = Number(item.unit_price || 0);
        const taxable = Number(item.taxable_value || 0);
        const cgst = Number(item.cgst_amount || 0);
        const sgst = Number(item.sgst_amount || 0);

        const total = taxable + cgst + sgst;

        return `
        <tr>
          <td>${item.description || ""}</td>
          <td>${qty}</td>
          <td>${price.toFixed(2)}</td>
          <td>${total.toFixed(2)}</td>
        </tr>
        `;
      })
      .join("");

    // =========================
    // SIMPLE HTML (SAFE FIRST)
    // =========================
    const html = `
      <html>
      <body style="font-family: Arial; padding: 20px;">
        <h2>Invoice ${invoice.invoice_number || ""}</h2>

        <p><strong>Client:</strong> ${invoice.clients?.name || ""}</p>
        <p><strong>Address:</strong> ${invoice.clients?.address || ""}</p>

        <table border="1" cellspacing="0" cellpadding="6" width="100%">
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          ${rows}
        </table>

        <h3>Total: ₹${Number(invoice.grand_total || 0).toFixed(2)}</h3>
      </body>
      </html>
    `;

    // =========================
    // GENERATE PDF
    // =========================
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // =========================
    // SEND PDF
    // =========================
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Invoice_${invoice.invoice_number}.pdf`
    );

    res.end(pdf);

  } catch (err) {
    console.error("ERROR:", err);

    return res.status(500).send(`
      <h1>SERVER ERROR</h1>
      <pre>${err.stack}</pre>
    `);
  }
}