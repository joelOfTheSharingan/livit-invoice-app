import { supabase } from "./lib/supabase";
import "./Login.css";

export default function Login() {

  async function signInWithGoogle() {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const redirectTo = isLocal
      ? "http://localhost:5173/"
      : "https://joelOfTheSharingan.github.io/livit-invoice-app/";

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

        {/* Logo */}
        <svg viewBox="-2 -20 40 44" width="70" xmlns="http://www.w3.org/2000/svg">
          <path d="M -1 1 L 20 23 L 24 19 L 7 1 L 24 -16 L 20 -20 Z" fill="#E53935"/>
          <path d="M 11 1 L 26 -14 L 30 -10 L 25 -5 L 37 7 L 33 11 L 21 -1 L 19 1 L 31 13 L 27 17 Z" fill="#E53935"/>
        </svg>

        <h1 className="login-title">Livit Interiors</h1>
        <p className="login-subtitle">Invoice Management System</p>

        {/* Google Login Button */}
        <button className="login-btn" onClick={signInWithGoogle}>
          <svg
            className="login-btn__icon"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>

          Sign in with Google
        </button>

      </div>
    </div>
  );
}