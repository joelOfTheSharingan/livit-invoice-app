const API_URL =
  import.meta.env.DEV
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