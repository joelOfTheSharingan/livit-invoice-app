import { useState, useEffect, useCallback } from "react";
import {
  fetchInvoices,
  createInvoice,
  insertInvoiceItems,
  fetchItemDescriptions,
} from "../services/invoiceService.js";

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadItemOptions = useCallback(async () => {
    try {
      const data = await fetchItemDescriptions();
      setItemOptions(data);
    } catch (err) {
      console.error("Failed to load item descriptions:", err);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    loadItemOptions();
  }, [loadInvoices, loadItemOptions]);

  const addInvoice = useCallback(async (invoicePayload, itemsPayload, clientName) => {
    setLoading(true);
    try {
      const invoice = await createInvoice(invoicePayload);
      const items = itemsPayload.map((it) => ({ ...it, invoice_id: invoice.id }));
      await insertInvoiceItems(items);
      setInvoices((prev) => [{ ...invoice, clients: { name: clientName } }, ...prev]);
      return invoice;
    } finally {
      setLoading(false);
    }
  }, []);

  const prependInvoice = useCallback((invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
  }, []);

  return { invoices, itemOptions, loading, error, loadInvoices, addInvoice, prependInvoice };
}
