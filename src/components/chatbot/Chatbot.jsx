import React from "react";
import { useChat } from "../../hooks/useChat.js";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";
import "./Chatbot.css";

export default function Chatbot() {
  const { messages, loading, sendMessage } = useChat();

  return (
    <div className="chatbot">
      <div className="chat-header">Livit Assistant</div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            Ask me anything about invoices or clients.
          </div>
        )}
        {messages.map((msg, index) => (
          <ChatMessage key={index} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="message assistant thinking">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}
      </div>

      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
