import { pool } from "./db.js";

// ✅ Fetch full invoice
export async function getInvoice(id) {
  const result = await pool.query(
    `
    SELECT 
      i.*,
      c.name AS client_name,
      c.email,
      c.phone,
      c.address,
      (
        SELECT json_agg(ii)
        FROM invoice_items ii
        WHERE ii.invoice_id = i.id
      ) AS items
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = $1;
    `,
    [id]
  );

  return result.rows[0];
}

// ✅ Format invoice
export function formatInvoice(data) {
  return {
    invoiceNumber: data.invoice_number,
    date: data.created_at,
    dueDate: data.due_date,

    client: {
      name: data.client_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    },

    items: (data.items || []).map((item) => ({
      description: item.description,
      qty: item.qty,
      rate: item.rate,
      amount: item.qty * item.rate,
    })),

    subtotal: data.subtotal,
    gst: data.gst_rate,
    total: data.total,
    preparedBy: data.prepared_by,
    notes: data.notes,
  };
}

// ✅ Generate HTML
export function generateHTML(inv) {
  return `
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
      </style>
    </head>
    <body>

      <h1>Invoice ${inv.invoiceNumber}</h1>

      <p><strong>Client:</strong> ${inv.client.name}</p>
      <p><strong>Email:</strong> ${inv.client.email || ""}</p>
      <p><strong>Phone:</strong> ${inv.client.phone || ""}</p>
      <p><strong>Address:</strong> ${inv.client.address || ""}</p>

      <p><strong>Date:</strong> ${inv.date}</p>
      <p><strong>Due:</strong> ${inv.dueDate || ""}</p>

      <table>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
        ${inv.items.map(i => `
          <tr>
            <td>${i.description}</td>
            <td>${i.qty}</td>
            <td>${i.rate}</td>
            <td>${i.amount}</td>
          </tr>
        `).join("")}
      </table>

      <h3>Subtotal: ₹${inv.subtotal}</h3>
      <h3>GST: ${inv.gst}%</h3>
      <h2>Total: ₹${inv.total}</h2>

      <p><strong>Prepared By:</strong> ${inv.preparedBy}</p>
      <p>${inv.notes || ""}</p>

    </body>
    </html>
  `;
}