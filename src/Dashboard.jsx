import { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabase.js";
import "./Dashboard.css";

// ─── Helpers ────────────────────────────────────────────────
function numberToWords(n) {
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const num = Math.round(n);
  if (!num) return "Zero Rupees Only";
  function w(x) {
    if (x < 20) return a[x];
    if (x < 100) return b[Math.floor(x/10)] + (x%10 ? " "+a[x%10] : "");
    if (x < 1000) return a[Math.floor(x/100)]+" Hundred"+(x%100?" "+w(x%100):"");
    if (x < 100000) return w(Math.floor(x/1000))+" Thousand"+(x%1000?" "+w(x%1000):"");
    if (x < 10000000) return w(Math.floor(x/100000))+" Lakh"+(x%100000?" "+w(x%100000):"");
    return w(Math.floor(x/10000000))+" Crore"+(x%10000000?" "+w(x%10000000):"");
  }
  return w(num) + " Rupees Only";
}

const fmt = (v) => Number(v || 0).toFixed(2);
const uid  = () => crypto.randomUUID();
const UNITS = ["Nos", "m", "kg", "L", "Sqm", "Sqft", "Rmt", "Set", "Lot", "Job", "Hrs"];
const STATUS_OPTIONS = ["draft", "sent", "paid", "overdue"];

function blankItem() {
  return { id: uid(), description: "", hsn_code: "", qty: 1, unit: "Nos", unit_price: 0, discount: 0, cgst_rate: 9, sgst_rate: 9 };
}

function calcItem(item) {
  const gross = Number(item.qty) * Number(item.unit_price);
  const disc  = (gross * Number(item.discount || 0)) / 100;
  const taxable = gross - disc;
  const cgst_amount = (taxable * Number(item.cgst_rate || 0)) / 100;
  const sgst_amount = (taxable * Number(item.sgst_rate || 0)) / 100;
  const amount = taxable + cgst_amount + sgst_amount;
  return { gross_value: gross, discount_amt: disc, taxable_value: taxable, cgst_amount, sgst_amount, amount };
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast--${type}`}>
      {type === "success" ? "✓" : "✕"} {msg}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function Dashboard({ user }) {
  const [tab, setTab] = useState("new"); // "new" | "list"
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // refs / dropdown data
  const [clientOptions, setClientOptions] = useState([]);
  const [itemOptions, setItemOptions]     = useState([]);
  const [invoices, setInvoices]           = useState([]);

  // ── New Invoice State ──
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  const [client, setClient] = useState({
    name:"", gst_no:"", email:"", phone:"", address:"",
    state:"", place_of_supply:"",
    bank_name:"", account_name:"", account_no:"", ifsc:"", branch:""
  });

  const [meta, setMeta] = useState({
    invoice_number: "INV-" + Date.now(),
    invoice_date: new Date().toISOString().slice(0,10),
    due_date: "", job_number: "", place_of_work: "", notes: "",
    status: "draft",
  });

  const [items, setItems] = useState([blankItem()]);
  const [useGST, setUseGST] = useState(true);
  const [roundOff, setRoundOff] = useState(true);

  // ── Invoice List State ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const preparedBy = user?.user_metadata?.full_name || user?.email || "Unknown";

  const showToast = (msg, type="success") => setToast({ msg, type });

  // ─── Load Data ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    fetchClients();
    fetchItemDescriptions();
    fetchInvoices();
  }, [user?.id]);

  async function fetchClients() {
    // Upgraded: Fetching full bank and address details for auto-fill
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, gst_no, email, phone, address, state, place_of_supply, bank_name, account_name, account_no, ifsc, branch")
      .order("name");
    if (!error) setClientOptions(data || []);
  }

  async function fetchItemDescriptions() {
    const { data, error } = await supabase.from("invoice_items").select("description");
    if (!error) {
      const unique = [...new Set((data||[]).map(i => i.description?.trim()).filter(Boolean))];
      setItemOptions(unique);
    }
  }

  async function fetchInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });
    if (!error) setInvoices(data || []);
  }

  // ─── Client helpers ────────────────────────────────────
  function setC(field, val) { setClient(p => ({ ...p, [field]: val })); }

  function handleClientSelect(val) {
    if (val === "NEW") { 
      setIsNewClient(true); 
      setSelectedClientId(""); 
      // Clear state for new entry
      setClient({
        name:"", gst_no:"", email:"", phone:"", address:"",
        state:"", place_of_supply:"",
        bank_name:"", account_name:"", account_no:"", ifsc:"", branch:""
      });
      return; 
    }
    
    setIsNewClient(false);
    setSelectedClientId(val);

    // Auto-fill feature: Load selected client data into state 
    const selected = clientOptions.find(c => String(c.id) === String(val));
    if (selected) {
      setClient({
        name: selected.name || "",
        gst_no: selected.gst_no || "",
        email: selected.email || "",
        phone: selected.phone || "",
        address: selected.address || "",
        state: selected.state || "",
        place_of_supply: selected.place_of_supply || "",
        bank_name: selected.bank_name || "",
        account_name: selected.account_name || "",
        account_no: selected.account_no || "",
        ifsc: selected.ifsc || "",
        branch: selected.branch || ""
      });
    }
  }

  // ─── Meta helpers ───────────────────────────────────────
  function setM(field, val) { setMeta(p => ({ ...p, [field]: val })); }

  // ─── Item helpers ───────────────────────────────────────
  function updateItem(id, field, value) {
    setItems(p => p.map(it => it.id === id ? { ...it, [field]: value } : it));
  }

  function addItem() { setItems(p => [...p, blankItem()]); }
  function removeItem(id) { setItems(p => p.filter(it => it.id !== id)); }

  // ─── Totals ─────────────────────────────────────────────
  const computed = items.map(it => ({ ...it, ...calcItem(it) }));

  const taxableTotal  = computed.reduce((s, it) => s + it.taxable_value, 0);
  const discountTotal = computed.reduce((s, it) => s + it.discount_amt, 0);
  const cgstTotal     = useGST ? computed.reduce((s, it) => s + it.cgst_amount, 0) : 0;
  const sgstTotal     = useGST ? computed.reduce((s, it) => s + it.sgst_amount, 0) : 0;
  const grandRaw      = taxableTotal + cgstTotal + sgstTotal;
  const roundOffAmt   = roundOff ? Math.round(grandRaw) - grandRaw : 0;
  const grandTotal    = grandRaw + roundOffAmt;

  // ─── Create Invoice ─────────────────────────────────────
  async function createInvoice() {
    if (items.some(it => !it.description?.trim())) {
      showToast("All items need a description", "error"); return;
    }

    setLoading(true);
    let clientId = selectedClientId;

    if (isNewClient) {
      if (!client.name.trim()) { showToast("Client name required", "error"); setLoading(false); return; }
      const { data, error } = await supabase
        .from("clients")
        .insert([{
          name: client.name, 
          gst_no: client.gst_no, 
          email: client.email,
          phone: client.phone, 
          address: client.address,
          state: client.state, 
          place_of_supply: client.place_of_supply,
          bank_name: client.bank_name, 
          account_name: client.account_name,
          account_no: client.account_no, 
          ifsc: client.ifsc, 
          branch: client.branch
        }])
        .select();
        
      if (error || !data?.[0]?.id) {
        showToast("Failed to create client", "error"); setLoading(false); return;
      }
      clientId = data[0].id;
      setClientOptions(p => [...p, data[0]]);
    }

    if (!clientId) { showToast("Select or create a client", "error"); setLoading(false); return; }

    const invoicePayload = {
      invoice_number: meta.invoice_number,
      invoice_date: meta.invoice_date || null,
      due_date: meta.due_date || null,
      job_number: meta.job_number || null,
      place_of_work: meta.place_of_work || null,
      notes: meta.notes || null,
      client_id: clientId,
      user_id: user.id,
      prepared_by: preparedBy,
      subtotal: taxableTotal,
      gst_rate: useGST ? (computed[0]?.cgst_rate + computed[0]?.sgst_rate) : 0,
      taxable_amount: taxableTotal,
      discount_total: discountTotal,
      cgst_total: cgstTotal,
      sgst_total: sgstTotal,
      round_off: roundOffAmt,
      grand_total: grandTotal,
      total: grandTotal,
      amount_in_words: numberToWords(grandTotal),
    };

    const { data: invData, error: invErr } = await supabase
      .from("invoices").insert([invoicePayload]).select();

    if (invErr || !invData?.[0]) {
      showToast("Failed to create invoice", "error"); setLoading(false); return;
    }

    const invId = invData[0].id;
    const c = computed;
    const itemsPayload = c.map(it => ({
      invoice_id: invId,
      description: it.description,
      hsn_code: it.hsn_code || null,
      qty: it.qty,
      unit: it.unit,
      unit_price: it.unit_price,
      rate: it.unit_price,
      discount: it.discount,
      gross_value: it.gross_value,
      taxable_value: it.taxable_value,
      cgst_rate: useGST ? it.cgst_rate : 0,
      sgst_rate: useGST ? it.sgst_rate : 0,
      cgst_amount: useGST ? it.cgst_amount : 0,
      sgst_amount: useGST ? it.sgst_amount : 0,
      amount: it.amount,
    }));

    const { error: itemErr } = await supabase.from("invoice_items").insert(itemsPayload);
    if (itemErr) showToast("Items save failed", "error");

    const clientObj = clientOptions.find(c => c.id === clientId) || { name: client.name };
    setInvoices(p => [{ ...invData[0], clients: { name: clientObj.name } }, ...p]);

    showToast(`Invoice ${meta.invoice_number} created!`);
    resetForm();
    setLoading(false);
  }

  function resetForm() {
    setIsNewClient(false);
    setSelectedClientId("");
    setClient({ name:"", gst_no:"", email:"", phone:"", address:"",
      state:"", place_of_supply:"",
      bank_name:"", account_name:"", account_no:"", ifsc:"", branch:"" });
    setMeta({ invoice_number:"INV-"+Date.now(), invoice_date:new Date().toISOString().slice(0,10),
      due_date:"", job_number:"", place_of_work:"", notes:"", status:"draft" });
    setItems([blankItem()]);
  }

  async function logout() { await supabase.auth.signOut(); }

  // ─── Filtered Invoices ──────────────────────────────────
  const filteredInvoices = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.clients?.name?.toLowerCase().includes(q) ||
      inv.job_number?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const avatarLetter = (user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase();

  // ────────────────────────────────────────────────────────
  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {/* NAV */}
      <nav className="nav">
        <div className="nav__brand">
  <svg id="logo" viewBox="-2 -20 40 44" width="70" xmlns="http://www.w3.org/2000/svg">
    <path d="M -1 1 L 20 23 L 24 19 L 7 1 L 24 -16 L 20 -20 Z" fill="#E53935"/>
    <path d="M 11 1 L 26 -14 L 30 -10 L 25 -5 L 37 7 L 33 11 L 21 -1 L 19 1 L 31 13 L 27 17 Z" fill="#E53935"/>
  </svg>

  <span className="brand-text">Livit Interiors</span>
</div>
        <div className="nav__right">
          <div className="nav__user">
            <div className="nav__avatar">{avatarLetter}</div>
            <span className="nav__email">{user?.email}</span>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Invoices</div>
          </div>
          {tab === "list" && (
            <button className="btn btn--accent" onClick={() => setTab("new")}>+ New Invoice</button>
          )}
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className={`tab-btn${tab==="new"?" active":""}`} onClick={() => setTab("new")}>New Invoice</button>
          <button className={`tab-btn${tab==="list"?" active":""}`} onClick={() => { setTab("list"); fetchInvoices(); }}>
            All Invoices {invoices.length > 0 && `(${invoices.length})`}
          </button>
        </div>

        {/* ══════════ NEW INVOICE TAB ══════════ */}
        {tab === "new" && (
          <>
            {/* ── PHASE 2: Invoice Metadata ── */}
            <div className="card">
              <div className="card__head">
                Invoice Details
              </div>
              <div className="grid4">
                <div className="field">
                  <label>Invoice No.</label>
                  <input type="text" value={meta.invoice_number}
                    onChange={e => setM("invoice_number", e.target.value)} />
                </div>
                <div className="field">
                  <label>Invoice Date</label>
                  <input type="date" value={meta.invoice_date}
                    onChange={e => setM("invoice_date", e.target.value)} />
                </div>
                <div className="field">
                  <label>Due Date</label>
                  <input type="date" value={meta.due_date}
                    onChange={e => setM("due_date", e.target.value)} />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={meta.status} onChange={e => setM("status", e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="field span2">
                  <label>Job Number</label>
                  <input type="text" placeholder="JOB-001" value={meta.job_number}
                    onChange={e => setM("job_number", e.target.value)} />
                </div>
                <div className="field span2">
                  <label>Place of Work</label>
                  <input type="text" placeholder="Site / location" value={meta.place_of_work}
                    onChange={e => setM("place_of_work", e.target.value)} />
                </div>
              </div>
            </div>

            {/* ── PHASE 7: Client ── */}      

<div className="card">
  <div className="card__head">
    Bill To
    {isNewClient && (
      <button className="btn--link" onClick={() => setIsNewClient(false)}>← Select existing</button>
    )}
  </div>

  {!isNewClient ? (
    <div className="client-toggle">
      <div className="field" style={{ flex: 1, maxWidth: 360 }}>
        <label>Client</label>
        <select value={selectedClientId} onChange={e => handleClientSelect(e.target.value)}>
          <option value="">Select client…</option>
          {clientOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="NEW">+ Add new client</option>
        </select>
      </div>
    </div>
  ) : (
    <>
      {/* Client Basic Info */}
      <div className="grid3" style={{ marginBottom: 14 }}>
        <div className="field span2">
          <label>Client Name *</label>
          <input type="text" placeholder="Company or person name" value={client.name} onChange={e => setC("name", e.target.value)} />
        </div>
        <div className="field">
          <label>GST Number</label>
          <input type="text" placeholder="22AAAAA0000A1Z5" value={client.gst_no} onChange={e => setC("gst_no", e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="client@email.com" value={client.email} onChange={e => setC("email", e.target.value)} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input type="text" placeholder="+91 98765 43210" value={client.phone} onChange={e => setC("phone", e.target.value)} />
        </div>
        <div className="field span2">
          <label>Address</label>
          <input type="text" placeholder="Street, City, PIN" value={client.address} onChange={e => setC("address", e.target.value)} />
        </div>
      </div>

      <div className="divider" style={{ margin: '20px 0', borderTop: '1px solid var(--glass-border)' }} />

      {/* Client Bank Details (Mapped to your new columns) */}
      <div className="card__head" style={{ marginBottom: 14, border: 'none', padding: 0, fontSize: '0.9rem' }}>
        Client Bank Details (Optional)
      </div>
      <div className="grid3">
        <div className="field">
          <label>Bank Name</label>
          <input type="text" placeholder="e.g. HDFC Bank" value={client.bank_name} onChange={e => setC("bank_name", e.target.value)} />
        </div>
        <div className="field">
          <label>Account Name</label>
          <input type="text" placeholder="Name as per bank" value={client.account_name} onChange={e => setC("account_name", e.target.value)} />
        </div>
        <div className="field">
          <label>Account Number</label>
          <input type="number" placeholder="000012345678" value={client.account_no} onChange={e => setC("account_no", e.target.value)} />
        </div>
        <div className="field">
          <label>IFSC Code</label>
          <input type="text" placeholder="HDFC0001234" value={client.ifsc} onChange={e => setC("ifsc", e.target.value)} />
        </div>
        <div className="field">
          <label>Branch</label>
          <input type="text" placeholder="Branch Name" value={client.branch} onChange={e => setC("branch", e.target.value)} />
        </div>
      </div>
    </>
  )}
</div>

            {/* ── PHASE 3 + 4: Items + GST ── */}
            <div className="card">
              <div className="card__head">
                Line Items
                
              </div>

              {/* GST Toggle */}
              <div className="gst-row-header">
                <label className="gst-toggle">
                  <input type="checkbox" checked={useGST} onChange={e => setUseGST(e.target.checked)} />
                  Apply GST
                </label>
                {useGST && (
                  <div className="gst-inputs">
                    <div className="field">
                      <label>CGST %</label>
                      <input type="number" value={computed[0]?.cgst_rate ?? 9} min="0" max="14"
                        onChange={e => setItems(p => p.map(it => ({ ...it, cgst_rate: Number(e.target.value) })))} />
                    </div>
                    <div className="field">
                      <label>SGST %</label>
                      <input type="number" value={computed[0]?.sgst_rate ?? 9} min="0" max="14"
                        onChange={e => setItems(p => p.map(it => ({ ...it, sgst_rate: Number(e.target.value) })))} />
                    </div>
                    <div className="gst-rate-display">
                      Total GST: {(computed[0]?.cgst_rate ?? 9) + (computed[0]?.sgst_rate ?? 9)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="items-table-wrap">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th style={{ width: 200 }}>Description</th>
                      <th style={{ width: 90 }}>HSN</th>
                      <th style={{ width: 60 }} className="num">Qty</th>
                      <th style={{ width: 80 }}>Unit</th>
                      <th style={{ width: 90 }} className="num">Unit Price</th>
                      <th style={{ width: 70 }} className="num">Disc%</th>
                      <th style={{ width: 100 }} className="num">Taxable</th>
                      {useGST && <th style={{ width: 80 }} className="num">CGST</th>}
                      {useGST && <th style={{ width: 80 }} className="num">SGST</th>}
                      <th style={{ width: 100 }} className="num">Amount</th>
                      <th className="td-rm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {computed.map((item, idx) => (
                      <tr key={item.id}>
                        <td>
                          <select
                            value={item.description}
                            onChange={e => {
                              if (e.target.value === "__custom__") {
                                updateItem(item.id, "description", "");
                              } else {
                                updateItem(item.id, "description", e.target.value);
                              }
                            }}
                            style={{ minWidth: 160 }}
                          >
                            <option value="">Select…</option>
                            {itemOptions.map((d, i) => <option key={i} value={d}>{d}</option>)}
                            <option value="__custom__">+ Custom</option>
                          </select>
                          {(!itemOptions.includes(item.description) || item.description === "") && (
                            <input type="text" placeholder="Custom description"
                              value={item.description}
                              onChange={e => updateItem(item.id, "description", e.target.value)}
                              style={{ marginTop: 4 }} />
                          )}
                        </td>
                        <td>
                          <input type="text" placeholder="HSN" value={item.hsn_code}
                            onChange={e => updateItem(item.id, "hsn_code", e.target.value)} style={{ width: 80 }} />
                        </td>
                        <td>
                          <input type="number" value={item.qty} min="0"
                            onChange={e => updateItem(item.id, "qty", e.target.value)} style={{ width: 55, textAlign: "right" }} />
                        </td>
                        <td>
                          <select value={item.unit} onChange={e => updateItem(item.id, "unit", e.target.value)} style={{ width: 75 }}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td>
                          <input type="number" value={item.unit_price} min="0"
                            onChange={e => updateItem(item.id, "unit_price", e.target.value)} style={{ width: 85, textAlign: "right" }} />
                        </td>
                        <td>
                          <input type="number" value={item.discount} min="0" max="100"
                            onChange={e => updateItem(item.id, "discount", e.target.value)} style={{ width: 60, textAlign: "right" }} />
                        </td>
                        <td className="item-amount">₹{fmt(item.taxable_value)}</td>
                        {useGST && <td className="item-amount">₹{fmt(item.cgst_amount)}</td>}
                        {useGST && <td className="item-amount">₹{fmt(item.sgst_amount)}</td>}
                        <td className="item-amount" style={{ fontWeight: 600 }}>₹{fmt(item.amount)}</td>
                        <td className="td-rm">
                          <button className="btn btn--danger" onClick={() => removeItem(item.id)}
                            disabled={items.length === 1} title="Remove">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 10, marginBottom: 16 }}>
                <button className="btn btn--sm" onClick={addItem}>+ Add Row</button>
              </div>

              {/* Totals */}
              <div className="totals-panel">
                <div className="totals-box">
                  {discountTotal > 0 && (
                    <div className="totals-row">
                      <span className="totals-label">Discount</span>
                      <span className="totals-value" style={{ color: "var(--accent)" }}>− ₹{fmt(discountTotal)}</span>
                    </div>
                  )}
                  <div className="totals-row">
                    <span className="totals-label">Taxable Amount</span>
                    <span className="totals-value">₹{fmt(taxableTotal)}</span>
                  </div>
                  {useGST && (
                    <>
                      <div className="totals-row">
                        <span className="totals-label">CGST ({computed[0]?.cgst_rate ?? 9}%)</span>
                        <span className="totals-value">₹{fmt(cgstTotal)}</span>
                      </div>
                      <div className="totals-row">
                        <span className="totals-label">SGST ({computed[0]?.sgst_rate ?? 9}%)</span>
                        <span className="totals-value">₹{fmt(sgstTotal)}</span>
                      </div>
                    </>
                  )}
                  {roundOff && (
                    <div className="totals-row">
                      <span className="totals-label">
                        Round Off &nbsp;
                        <button className="btn--link" onClick={() => setRoundOff(false)}>off</button>
                      </span>
                      <span className="totals-value">{roundOffAmt >= 0 ? "+" : ""}₹{fmt(roundOffAmt)}</span>
                    </div>
                  )}
                  {!roundOff && (
                    <div className="totals-row">
                      <span className="totals-label">
                        <button className="btn--link" onClick={() => setRoundOff(true)}>Enable round-off</button>
                      </span>
                    </div>
                  )}
                  <div className="totals-row grand">
                    <span className="totals-label">Grand Total</span>
                    <span className="totals-value">₹{fmt(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="words-box">
                {numberToWords(grandTotal)}
              </div>
            </div>

            {/* ── Notes + Declaration ── */}
            <div className="card">
              <div className="card__head">Notes & Declaration</div>
              <div className="grid2">
                <div className="field">
                  <label>Notes / Terms</label>
                  <textarea placeholder="Payment terms, special instructions…" value={meta.notes}
                    onChange={e => setM("notes", e.target.value)} />
                </div>
                <div className="field">
                  <label>Declaration</label>
                  <textarea placeholder="We declare that this invoice shows the actual price of the goods/services described…"
                    defaultValue="We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct." />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="form-actions form-actions--end">
              <button className="btn" onClick={resetForm}>Reset</button>
              <button className="btn btn--primary" onClick={createInvoice} disabled={loading}>
                {loading ? <><span className="spinner" /> Saving…</> : "Create Invoice →"}
              </button>
            </div>
          </>
        )}

        {/* ══════════ INVOICE LIST TAB ══════════ */}
        {tab === "list" && (
          <div className="card">
            <div className="card__head">
              Invoice History
              <span className="card__head-tag">{filteredInvoices.length} records</span>
            </div>

            {/* Filters */}
            <div className="inv-filters">
              <div className="field inv-search">
                <input type="text" placeholder="Search by invoice no, client, job…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="field" style={{ width: 160 }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <div>No invoices found</div>
              </div>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice No.</th>
                    <th>Client</th>
                    <th>Job No.</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                    <th className="num">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.invoice_date}</td>
                      <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                      <td>{inv.clients?.name || "Unknown"}</td>
                      <td>{inv.job_number || "—"}</td>
                      <td>
                        <span className={`status-badge status--${inv.status}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="num" style={{ fontWeight: 600 }}>₹{fmt(inv.grand_total)}</td>
                      <td className="num">
                        <a href={`https://livit-invoice-app.vercel.app/api/invoice?id=${inv.id}`} target="_blank" rel="noreferrer" className="btn btn--sm">
                          📄 PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}