import React from "react";

export default function ClientSection({
  clients,
  selectedClientId,
  isNewClient,
  client,
  onClientSelect,
  onClientChange,
  onBackToSelect,
}) {
  const setC = (field) => (e) => onClientChange(field, e.target.value);

  return (
    <div className="card">
      <div className="card__head">
        Bill To
        {isNewClient && (
          <button className="btn--link" onClick={onBackToSelect}>
            ← Select existing
          </button>
        )}
      </div>

      {!isNewClient ? (
        <div className="client-toggle">
          <div className="field" style={{ flex: 1, maxWidth: 360 }}>
            <label>Client</label>
            <select value={selectedClientId} onChange={(e) => onClientSelect(e.target.value)}>
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="NEW">+ Add new client</option>
            </select>
          </div>
        </div>
      ) : (
        <>
          <div className="grid3" style={{ marginBottom: 14 }}>
            <div className="field span2">
              <label>Client Name *</label>
              <input
                type="text"
                placeholder="Company or person name"
                value={client.name}
                onChange={setC("name")}
              />
            </div>
            <div className="field">
              <label>GST Number</label>
              <input
                type="text"
                placeholder="22AAAAA0000A1Z5"
                value={client.gst_no}
                onChange={setC("gst_no")}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="client@email.com"
                value={client.email}
                onChange={setC("email")}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={client.phone}
                onChange={setC("phone")}
              />
            </div>
            <div className="field span2">
              <label>Address</label>
              <input
                type="text"
                placeholder="Street, City, PIN"
                value={client.address}
                onChange={setC("address")}
              />
            </div>
          </div>

          <div
            className="divider"
            style={{ margin: "20px 0", borderTop: "1px solid var(--glass-border)" }}
          />

          <div
            className="card__head"
            style={{ marginBottom: 14, border: "none", padding: 0, fontSize: "0.9rem" }}
          >
            Client Bank Details (Optional)
          </div>
          <div className="grid3">
            <div className="field">
              <label>Bank Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank"
                value={client.bank_name}
                onChange={setC("bank_name")}
              />
            </div>
            <div className="field">
              <label>Account Name</label>
              <input
                type="text"
                placeholder="Name as per bank"
                value={client.account_name}
                onChange={setC("account_name")}
              />
            </div>
            <div className="field">
              <label>Account Number</label>
              <input
                type="number"
                placeholder="000012345678"
                value={client.account_no}
                onChange={setC("account_no")}
              />
            </div>
            <div className="field">
              <label>IFSC Code</label>
              <input
                type="text"
                placeholder="HDFC0001234"
                value={client.ifsc}
                onChange={setC("ifsc")}
              />
            </div>
            <div className="field">
              <label>Branch</label>
              <input
                type="text"
                placeholder="Branch Name"
                value={client.branch}
                onChange={setC("branch")}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
