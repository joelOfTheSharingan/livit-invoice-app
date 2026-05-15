import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const LOGIN_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000/login"
      : "https://joelofthesharingan.github.io/livit-invoice-app/login";

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      const sessionUser = data?.session?.user ?? null;

      if (error) {
        console.error("Auth error:", error);
      }

      if (!sessionUser) {
        window.location.href = LOGIN_URL;
        return;
      }

      setUser(sessionUser);
      setLoading(false);
    };

    init();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}