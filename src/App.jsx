import { useEffect } from "react";
import { supabase } from "./lib/supabase.js";
import { useAuth } from "./auth/UseAuth.js";
import Dashboard from "./Dashboard.jsx";
import Login from "./Login.jsx";

export default function App() {
  const { user, loading } = useAuth();

  // sync user to DB (runs once per login session)
  useEffect(() => {
    if (!user) return;

    const syncUser = async () => {
      const { error } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.full_name ?? null,
        role: "supervisor",
      });

      if (error) {
        console.error("User sync error:", error);
      }
    };

    syncUser();
  }, [user]);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return user ? <Dashboard user={user} /> : <Login />;
}