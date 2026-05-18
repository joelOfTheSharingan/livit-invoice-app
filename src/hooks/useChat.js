import { useState, useCallback } from "react";
import { sendChatMessage } from "../services/chatService.js";

const SYSTEM_MESSAGE = {
  role: "system",
  content: "You are Titan Assistant for Livit Interiors. Help users manage invoices, answer questions about clients, and provide business insights.",
};

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setLoading(true);
    setError(null);

    try {
      const allMessages = [SYSTEM_MESSAGE, ...updatedMessages];
      const reply = await sendChatMessage(allMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages };
}
