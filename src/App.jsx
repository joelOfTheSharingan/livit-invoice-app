import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase.js";
import Dashboard from "./Dashboard.jsx";
import Login from "./Login.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ prevent duplicate sync calls
  const syncedRef = useRef(false);

  useEffect(() => {
    // 🔥 Get current session
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const u = session?.user ?? null;
      setUser(u);

      if (u && !syncedRef.current) {
        await syncUser(u);
        syncedRef.current = true;
      }

      setLoading(false);
    };

    init();

    // 🔥 Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;

        setUser((prev) => {
          if (prev?.id === u?.id) return prev; // ✅ avoid re-render loop
          return u;
        });

        if (u && !syncedRef.current) {
          await syncUser(u);
          syncedRef.current = true;
        }

        // 🔥 reset flag on logout
        if (!u) {
          syncedRef.current = false;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 🔥 Sync user to DB
  async function syncUser(authUser) {
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

    if (error) {
      console.error("User sync error:", error);
    }
  }

  // 🔥 Loading UI
  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  // 🔥 Auth routing
  return user ? <Dashboard user={user} /> : <Login />;
}