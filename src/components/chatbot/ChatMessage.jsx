import React from "react";

export default function ChatMessage({ role, content }) {
  return (
    <div className={`message ${role}`}>
      <span className="message-label">{role === "user" ? "You" : "Titan"}</span>
      <p className="message-content">{content}</p>
    </div>
  );
}
