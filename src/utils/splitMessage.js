// Helpers for fitting long text into Discord's 2000-character message limit.
const DISCORD_LIMIT = 2000;

// Splits text into <=limit chunks, breaking at the last newline when possible.
function splitMessage(text, limit = DISCORD_LIMIT) {
  const chunks = [];
  let rest = text;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n", limit);
    if (cut <= 0) cut = limit;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  chunks.push(rest);
  return chunks;
}

// Sends text to a channel as one or more chunked messages.
async function sendChunked(channel, text) {
  for (const chunk of splitMessage(text)) {
    await channel.send(chunk);
  }
}

module.exports = { splitMessage, sendChunked };
