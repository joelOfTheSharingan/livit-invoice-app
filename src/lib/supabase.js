import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sqkrvgbfajbnctezugqq.supabase.co";
const supabaseKey = "sb_publishable_L_9OGJQ7qv9mP7j7xr5Fmg_wyDnn2AG";

export const supabase = createClient(supabaseUrl, supabaseKey);