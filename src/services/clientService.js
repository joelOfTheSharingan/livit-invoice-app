import { supabase } from "../lib/supabase.js";
import { LIVIT_SCHEMA } from "../utils/constants.js";

const db = () => supabase.schema(LIVIT_SCHEMA);

export async function fetchClients() {
  const { data, error } = await db()
    .from("clients")
    .select(
      "id, name, gst_no, email, phone, address, state, place_of_supply, bank_name, account_name, account_no, ifsc, branch"
    )
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function createClient(clientData) {
  const { data, error } = await db()
    .from("clients")
    .insert([clientData])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateClient(id, updates) {
  const { data, error } = await db()
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteClient(id) {
  const { error } = await db().from("clients").delete().eq("id", id);
  if (error) throw error;
}
