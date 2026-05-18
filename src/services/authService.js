import { supabase } from "../lib/supabase.js";
import { HOME_URL } from "../utils/constants.js";

export async function syncUserToDB(user) {
  const { error } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email,
    username: user.user_metadata?.full_name ?? null,
    role: "supervisor",
  });
  if (error) console.error("User sync error:", error);
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = HOME_URL;
}
