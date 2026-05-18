import React from "react";

export default function Input({ label, className = "", ...rest }) {
  return (
    <div className={`field ${className}`}>
      {label && <label>{label}</label>}
      <input {...rest} />
    </div>
  );
}
