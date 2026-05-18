import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    let mounted = true;

    const init = async () => {

      // 1. Get current session (IMPORTANT)
      const { data: sessionData } =
        await supabase.auth.getSession();

      if (mounted) {
        setUser(sessionData?.session?.user ?? null);
        setLoading(false);
      }

    };

    init();

    // 2. Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {

        setUser(session?.user ?? null);
        setLoading(false);

      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };

  }, []);

  return { user, loading };
}