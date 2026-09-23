import { useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import "../styles/Login.css";

export default function Login() {

  useEffect(() => {

    async function restoreSession() {

      // handles OAuth redirect recovery
      const {
        data,
        error
      } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        return;
      }

      if (data.session) {

        const isLocal =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        window.location.href = isLocal
          ? "http://localhost:3000/livit-invoice-app/"
          : "https://joelmg.in/";
      }
    }

    restoreSession();

    const {
      data: listener
    } = supabase.auth.onAuthStateChange(
      (event, session) => {

        if (
          event === "SIGNED_IN" &&
          session
        ) {

          const isLocal =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";

          window.location.href = isLocal
            ? "http://localhost:3000/livit-invoice-app/"
            : "https://joelmg.in/";
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  async function signInWithGoogle() {

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const redirectTo = isLocal
      ? "http://localhost:3000/livit-invoice-app/"
      : "https://joelmg.in/";

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

    if (error) {
      console.error(
        "Google Sign-In Error:",
        error.message
      );
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          Livit Interiors
        </h1>

        <p className="login-subtitle">
          Invoice Management System
        </p>

        <button
          className="login-btn"
          onClick={signInWithGoogle}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

