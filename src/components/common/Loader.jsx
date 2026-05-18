import React from "react";

export default function Loader({ text = "Loading…" }) {
  return (
    <div className="loader-wrap" aria-busy="true" aria-label={text}>
      <span className="spinner" />
      <span className="loader-text">{text}</span>
    </div>
  );
}
