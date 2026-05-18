import { supabase } from "../lib/supabase.js";
import { LIVIT_SCHEMA } from "../utils/constants.js";

const db = () => supabase.schema(LIVIT_SCHEMA);

export async function fetchInvoices() {
  const { data, error } = await db()
    .from("invoices")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchInvoiceById(id) {
  const { data, error } = await db()
    .from("invoices")
    .select("*, clients(*), invoice_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createInvoice(invoicePayload) {
  const { data, error } = await db()
    .from("invoices")
    .insert([invoicePayload])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateInvoiceStatus(id, status) {
  const { data, error } = await db()
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteInvoice(id) {
  const { error } = await db().from("invoices").delete().eq("id", id);
  if (error) throw error;
}

export async function insertInvoiceItems(items) {
  const { error } = await db().from("invoice_items").insert(items);
  if (error) throw error;
}

export async function fetchItemDescriptions() {
  const { data, error } = await db()
    .from("invoice_items")
    .select("description");
  if (error) throw error;
  const unique = [
    ...new Set(
      (data || []).map((i) => i.description?.trim()).filter(Boolean)
    ),
  ];
  return unique;
}
