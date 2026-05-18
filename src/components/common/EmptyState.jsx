import React from "react";

export default function EmptyState({ icon = "📭", message = "Nothing here yet." }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <div>{message}</div>
    </div>
  );
}
