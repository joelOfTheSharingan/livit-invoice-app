import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Dashboard from "./Dashboard.jsx";
import Login from "./Login.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 🔥 INIT USER (safe)
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth error:", error);
        }

        if (!mounted) return;

        setUser(data?.user ?? null);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // 🔥 AUTH LISTENER
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;

      setUser((prev) => {
        if (prev?.id === u?.id) return prev;
        return u;
      });

      // 🔥 SYNC USER (no lock issues)
      if (u) {
        setTimeout(() => {
          syncUser(u);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 🔥 SYNC USER (safe + no crash)
  async function syncUser(authUser) {
    try {
      const { error } = await supabase
        .from("users")
        .upsert(
          {
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name ?? null,
          },
          { onConflict: "id" }
        );

      if (error) throw error;
    } catch (err) {
      console.error("User sync error:", err);
    }
  }

  // 🔥 LOADING UI
  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  // 🔥 ROUTING
  return user ? <Dashboard user={user} /> : <Login />;
}