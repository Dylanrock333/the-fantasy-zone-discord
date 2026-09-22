const DISCORD_LIMIT = 2000;

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

// Sends `text` to `channel`, splitting it into multiple messages if it
// exceeds Discord's per-message length limit.
async function sendChunked(channel, text) {
  for (const chunk of splitMessage(text)) {
    await channel.send(chunk);
  }
}

module.exports = { splitMessage, sendChunked };
