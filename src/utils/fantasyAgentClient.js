const { FANTASY_AGENT_URL = "http://localhost:8787" } = process.env;

async function askFantasyAgent(sessionId, message) {
  const res = await fetch(`${FANTASY_AGENT_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`fantasy agent request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;

      const event = JSON.parse(dataLine.slice("data: ".length));
      if (event.type === "done") return event.text;
      if (event.type === "error") throw new Error(event.message);
    }
  }

  throw new Error("fantasy agent stream ended without a done event");
}

module.exports = { askFantasyAgent };
