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

    // =========================
    // FETCH DATA
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
      return res.status(404).send("Invoice not found");
    }

    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    // =========================
    // BUILD ROWS
    // =========================
    const rows = (items || [])
      .map((item) => {
        const rowTotal =
          Number(item.taxable_value || 0) +
          Number(item.cgst_amount || 0) +
          Number(item.sgst_amount || 0);

        return `
        <tr>
          <td>${item.description || ""}</td>
          <td>${item.qty || ""}</td>
          <td>${Number(item.unit_price).toFixed(2)}</td>
          <td>${rowTotal.toFixed(2)}</td>
        </tr>`;
      })
      .join("");

    // =========================
    // HTML
    // =========================
    const html = `
      <html>
      <body>
        <h2>Invoice ${invoice.invoice_number}</h2>
        <p>${invoice.clients?.name}</p>

        <table border="1" cellspacing="0" cellpadding="5">
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          ${rows}
        </table>

        <h3>Total: ₹${invoice.grand_total}</h3>
      </body>
      </html>
    `;

    // =========================
    // PUPPETEER (VERCEL SAFE)
    // =========================
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}