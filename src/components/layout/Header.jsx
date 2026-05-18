import React from "react";

export default function Header({ title, children }) {
  return (
    <div className="page-header">
      <div>
        <div className="page-title">{title}</div>
      </div>
      {children}
    </div>
  );
}
