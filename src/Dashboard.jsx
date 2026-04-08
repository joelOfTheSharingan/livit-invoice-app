import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import "./Dashboard.css";

export default function Dashboard({ user }) {
  // ================= STATE =================
  const [clientOptions, setClientOptions] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientGST, setClientGST] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  const [items, setItems] = useState([
    { id: crypto.randomUUID(), description: "", qty: 1, rate: 0, isCustom: false, customName: "" },
  ]);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const preparedBy = user?.user_metadata?.full_name || user?.email || "Unknown";

  // ================= LOAD DATA =================
useEffect(() => {
  if (!user?.id) return;

  fetchClients();
  fetchInvoiceItems();
  fetchInvoices();
}, [user?.id]);

  async function fetchClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) console.error("Error fetching clients:", error);
    setClientOptions(data || []);
  }

  async function fetchInvoiceItems() {
    const { data, error } = await supabase
      .from("invoice_items")
      .select("description")
      .not("description", "is", null);

    if (error) console.error("Error fetching invoice items:", error);

    const unique = [...new Set((data || []).map((i) => i.description?.trim()).filter(Boolean))];
    setItemOptions(unique);
  }

async function fetchInvoices() {
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      clients ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    return;
  }

  console.log("Invoices:", data);
  setInvoices(data || []);
}

  // ================= ITEM HANDLING =================
  function updateItem(id, field, value) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", qty: 1, rate: 0, isCustom: false, customName: "" },
    ]);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  // ================= TOTAL =================
  const total = items.reduce((sum, i) => sum + i.qty * i.rate, 0);

  // ================= CREATE INVOICE =================
  async function createInvoice() {
    let clientId = selectedClientId;

    if (isNewClient) {
      const { data, error } = await supabase
        .from("clients")
        .insert([{ name: clientName, gst_no: clientGST, email: clientEmail, phone: clientPhone, address: clientAddress }])
        .select();

      if (error || !data?.[0]?.id) {
        console.error("Failed to create client:", error);
        return;
      }

      clientId = data[0].id;
      setClientOptions((prev) => [...prev, data[0]]);
    }

    if (!clientId) return;

    setLoading(true);

    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .insert([
        { invoice_number: "INV-" + Date.now(), client_id: clientId, user_id: user.id, prepared_by: preparedBy, subtotal: total, gst_rate: 0, total },
      ])
      .select();

    if (invoiceError || !invoiceData?.[0]) {
      console.error("Insert failed:", invoiceError);
      setLoading(false);
      return;
    }

    const invoiceId = invoiceData[0].id;

    const itemsToInsert = items.map((i) => ({
      invoice_id: invoiceId,
      description: i.isCustom ? i.customName : i.description,
      qty: i.qty,
      rate: i.rate,
      amount: i.qty * i.rate,
    }));

    const { error: itemError } = await supabase.from("invoice_items").insert(itemsToInsert);
    if (itemError) console.error("Failed to insert invoice items:", itemError);

    // Attach client name for display
    const clientObj = clientOptions.find(c => c.id === clientId) || { name: clientName };
    const newInvoice = { ...invoiceData[0], clients: { name: clientObj.name } };

    setInvoices((prev) => [newInvoice, ...prev]);

    setLoading(false);

    // RESET FORM
    setSelectedClientId("");
    setIsNewClient(false);
    setClientName("");
    setClientGST("");
    setClientEmail("");
    setClientPhone("");
    setClientAddress("");
    setItems([{ id: crypto.randomUUID(), description: "", qty: 1, rate: 0, isCustom: false, customName: "" }]);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  // ================= UI =================
  return (
    <div className="dashboard">
      <div className="dashboard-nav">
        <div className="dashboard-nav__brand">Invoice App</div>
        <div className="dashboard-nav__right">
          <span className="dashboard-nav__email">{user?.email}</span>
          <button className="btn btn--ghost" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* CLIENT */}
        <div className="card">
          <div className="card__title">Client</div>
          {!isNewClient && (
            <select
              value={selectedClientId}
              onChange={(e) => {
                if (e.target.value === "NEW") {
                  setIsNewClient(true);
                  return;
                }
                setSelectedClientId(e.target.value);
              }}
            >
              <option value="">Select Client</option>
              {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="NEW">+ New Client</option>
            </select>
          )}
          {isNewClient && (
            <div className="client-fields">
              <input placeholder="Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              <input placeholder="Phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              <input placeholder="Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              <input placeholder="GST" value={clientGST} onChange={(e) => setClientGST(e.target.value)} />
              <input className="full-width" placeholder="Address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
            </div>
          )}
        </div>

        {/* ITEMS */}
        <div className="card">
          <div className="card__title">Items</div>
          <div className="items-header"><span>Item</span><span>Qty</span><span>Rate</span><span>Amount</span><span></span></div>
          {items.map((item) => (
            <div className="item-row" key={item.id}>
              <select
                value={item.isCustom ? "CUSTOM" : item.description}
                onChange={(e) => {
                  if (e.target.value === "CUSTOM") {
                    updateItem(item.id, "isCustom", true);
                    updateItem(item.id, "customName", "");
                    updateItem(item.id, "description", "");
                    return;
                  }
                  updateItem(item.id, "isCustom", false);
                  updateItem(item.id, "description", e.target.value);
                }}
              >
                <option value="">Select</option>
                {itemOptions.map((desc, j) => <option key={j} value={desc}>{desc}</option>)}
                <option value="CUSTOM">+ Custom</option>
              </select>

              {item.isCustom && (
                <input
                  placeholder="Enter item"
                  value={item.customName}
                  onChange={(e) => {
                    updateItem(item.id, "customName", e.target.value);
                    updateItem(item.id, "description", e.target.value);
                  }}
                />
              )}

              <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))} />
              <input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))} />
              <div className="item-row__amount">₹{item.qty * item.rate}</div>
              <button className="item-row__remove" onClick={() => removeItem(item.id)}>×</button>
            </div>
          ))}
          <div className="form-actions">
            <button className="btn" onClick={addItem}>+ Add Item</button>
            <button className="btn btn--primary" onClick={createInvoice} disabled={loading}>{loading ? "Saving..." : "Create Invoice"}</button>
          </div>
          <div className="invoice-totals">
            <div className="invoice-totals__row"><span className="invoice-totals__label">Total</span><span className="invoice-totals__value">₹{total}</span></div>
          </div>
        </div>

        {/* INVOICES */}
        <div className="card">
          <div className="card__title">Invoices</div>
          <div className="invoice-list">
            {invoices.length === 0 && <div className="empty-state">No invoices yet</div>}
            {invoices.map((inv) => (
              <div className="invoice-item" key={inv.id}>
                <div>
                  <div className="invoice-item__number">{inv.invoice_number}</div>
                  <div className="invoice-item__meta">{inv.clients?.name} • {inv.prepared_by}</div>
                </div>
                <div className="invoice-item__total">₹{inv.total}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}