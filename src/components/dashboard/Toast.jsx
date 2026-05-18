import React, { useEffect } from "react";

export default function Toast({ msg, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      {type === "success" ? "✓" : "✕"} {msg}
    </div>
  );
}
