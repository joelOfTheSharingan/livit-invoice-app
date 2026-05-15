import { supabase } from "./lib/supabase";
import "./Login.css";

export default function Login() {
  async function signInWithGoogle() {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const redirectTo = isLocal
      ? "http://localhost:3000/livit-invoice-app/"
      : "https://joelofthesharingan.github.io/livit-invoice-app/";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      console.error("Google Sign-In Error:", error.message);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">

        <h1 className="login-title">Livit Interiors</h1>
        <p className="login-subtitle">Invoice Management System</p>

        <button className="login-btn" onClick={signInWithGoogle}>
          Sign in with Google
        </button>

      </div>
    </div>
  );
}