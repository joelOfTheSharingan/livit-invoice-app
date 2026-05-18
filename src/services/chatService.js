const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_URL = isLocal
  ? "http://localhost:5001/api/chat"
  : "https://livit-invoice-app.vercel.app/api/chat";
export async function sendChatMessage(messages) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`);
  }

  const data = await response.json();

  return (
    data?.choices?.[0]?.message?.content ||
    "No response from AI."
  );
}