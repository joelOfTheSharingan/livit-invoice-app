import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Dashboard from "./Dashboard.jsx";
import Login from "./Login.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ✅ FIX: use getSession instead of getUser
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        const session = data.session;
        const u = session?.user ?? null;

        setUser(u);

        // 🔥 Sync user safely
        if (u) {
          setTimeout(() => {
            syncUser(u);
          }, 0);
        }
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

      // 🔥 Sync user (no lock issues)
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

  // 🔥 SYNC USER
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