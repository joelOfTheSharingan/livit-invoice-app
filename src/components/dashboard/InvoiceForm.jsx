import React, { useState, useCallback } from "react";
import InvoiceMeta from "./InvoiceMeta.jsx";
import ClientSection from "./ClientSection.jsx";
import LineItemsTable from "./LineItemsTable.jsx";
import TotalsPanel from "./TotalsPanel.jsx";
import Button from "../common/Button.jsx";

import { blankItem, defaultMeta, defaultClient } from "../../store/invoiceStore.js";
import { calcItem, calcTotals } from "../../utils/calculations.js";
import { validateInvoiceItems, validateClient } from "../../utils/validators.js";
import { numberToWords } from "../../utils/numberToWords.js";
import { getPreparedBy } from "../../store/authStore.js";

export default function InvoiceForm({
  user,
  clients,
  itemOptions,
  onSubmit,   // async (invoicePayload, itemsPayload, clientName) => void
  onAddClient,
  showToast,
}) {
  const [meta, setMeta] = useState(defaultMeta);
  const [items, setItems] = useState([blankItem()]);
  const [client, setClient] = useState(defaultClient);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);
  const [useGST, setUseGST] = useState(true);
  const [roundOff, setRoundOff] = useState(true);
  const [loading, setLoading] = useState(false);

  const setM = useCallback((field, val) => setMeta((p) => ({ ...p, [field]: val })), []);
  const setC = useCallback((field, val) => setClient((p) => ({ ...p, [field]: val })), []);

  const handleClientSelect = useCallback((val) => {
    if (val === "NEW") {
      setIsNewClient(true);
      setSelectedClientId("");
      setClient(defaultClient());
      return;
    }
    setIsNewClient(false);
    setSelectedClientId(val);
    const found = clients.find((c) => String(c.id) === String(val));
    if (found) setClient({ ...defaultClient(), ...found });
  }, [clients]);

  const updateItem = useCallback((id, field, value) =>
    setItems((p) => p.map((it) => (it.id === id ? { ...it, [field]: value } : it))),
  []);

  const addItem = useCallback(() => setItems((p) => [...p, blankItem()]), []);
  const removeItem = useCallback((id) => setItems((p) => p.filter((it) => it.id !== id)), []);

  const changeCGST = useCallback((rate) =>
    setItems((p) => p.map((it) => ({ ...it, cgst_rate: rate }))),
  []);
  const changeSGST = useCallback((rate) =>
    setItems((p) => p.map((it) => ({ ...it, sgst_rate: rate }))),
  []);

  const computed = items.map((it) => ({ ...it, ...calcItem(it) }));
  const totals = calcTotals(computed, useGST, roundOff);

  const resetForm = useCallback(() => {
    setMeta(defaultMeta());
    setItems([blankItem()]);
    setClient(defaultClient());
    setSelectedClientId("");
    setIsNewClient(false);
  }, []);

  const handleSubmit = async () => {
    if (!validateInvoiceItems(items)) {
      showToast("All items need a description", "error");
      return;
    }
    if (!validateClient(client, isNewClient)) {
      showToast("Client name required", "error");
      return;
    }
    if (!isNewClient && !selectedClientId) {
      showToast("Select or create a client", "error");
      return;
    }

    setLoading(true);
    try {
      let clientId = selectedClientId;
      let clientName = clients.find((c) => String(c.id) === String(clientId))?.name || client.name;

      if (isNewClient) {
        const newClient = await onAddClient({
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
          branch: client.branch,
        });
        clientId = newClient.id;
        clientName = newClient.name;
      }

      const preparedBy = getPreparedBy(user);
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
        subtotal: totals.taxableTotal,
        gst_rate: useGST ? (computed[0]?.cgst_rate + computed[0]?.sgst_rate) : 0,
        taxable_amount: totals.taxableTotal,
        discount_total: totals.discountTotal,
        cgst_total: totals.cgstTotal,
        sgst_total: totals.sgstTotal,
        round_off: totals.roundOffAmt,
        grand_total: totals.grandTotal,
        total: totals.grandTotal,
        amount_in_words: numberToWords(totals.grandTotal),
        status: meta.status,
      };

      const itemsPayload = computed.map((it) => ({
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

      await onSubmit(invoicePayload, itemsPayload, clientName);
      showToast(`Invoice ${meta.invoice_number} created!`);
      resetForm();
    } catch (err) {
      showToast(err.message || "Failed to create invoice", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <InvoiceMeta meta={meta} onChange={setM} />

      <ClientSection
        clients={clients}
        selectedClientId={selectedClientId}
        isNewClient={isNewClient}
        client={client}
        onClientSelect={handleClientSelect}
        onClientChange={setC}
        onBackToSelect={() => setIsNewClient(false)}
      />

      <div className="card">
        <div className="card__head">Line Items</div>
        <div className="gst-row-header">
          <label className="gst-toggle">
            <input
              type="checkbox"
              checked={useGST}
              onChange={(e) => setUseGST(e.target.checked)}
            />
            Apply GST
          </label>
        </div>
        <LineItemsTable
          computed={computed}
          items={items}
          itemOptions={itemOptions}
          useGST={useGST}
          onUpdateItem={updateItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />
        <TotalsPanel
          computed={computed}
          totals={totals}
          useGST={useGST}
          roundOff={roundOff}
          onToggleRoundOff={setRoundOff}
          onChangeCGST={changeCGST}
          onChangeSGST={changeSGST}
        />
      </div>

      <div className="card">
        <div className="card__head">Notes & Declaration</div>
        <div className="grid2">
          <div className="field">
            <label>Notes / Terms</label>
            <textarea
              placeholder="Payment terms, special instructions…"
              value={meta.notes}
              onChange={(e) => setM("notes", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Declaration</label>
            <textarea defaultValue="We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct." />
          </div>
        </div>
      </div>

      <div className="form-actions form-actions--end">
        <Button onClick={resetForm}>Reset</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>
          Create Invoice →
        </Button>
      </div>
    </>
  );
}
