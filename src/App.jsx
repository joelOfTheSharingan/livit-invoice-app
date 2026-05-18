import { useEffect } from "react";
import { supabase } from "./lib/supabase.js";
import { useAuth } from "./auth/useAuth.js";
import { syncUserToDB } from "./services/authService.js";
import "./styles/dashboard.css";
import Dashboard from "./pages/Dashboard.jsx";
import Chatbot from "./components/chatbot/Chatbot.jsx";
import Login from "./pages/Login.jsx";

import "./App.css";

export default function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!user) return;
    syncUserToDB(user);
  }, [user]);

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-layout">
      <div className="dashboard-section">
        <Dashboard user={user} />
      </div>
      <div className="chat-section">
        <Chatbot />
      </div>
    </div>
  );
}
